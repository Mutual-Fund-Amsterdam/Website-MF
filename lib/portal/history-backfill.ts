import {holdingsAt,bankControl} from "./ledger.ts";
import type {DailyQuotes,Position,Snapshot,PricePoint} from "./types";
const exchanges:Record<string,string>={"Euronext Amsterdam":"XAMS","Euronext Paris":"XPAR","NYSE American":"XASE",Nasdaq:"XNAS","New York Stock Exchange":"XNYS","Toronto Stock Exchange":"XTSE","Vienna Stock Exchange":"XWBO"};
const venueOverride:Record<string,string>={LEU:"XNYS",CEG:"XNYS",PANW:"XNYS",WMT:"XNYS"};
export type HistoryTask=Position&{historyFrom:string;historyTo:string;historyWindow:string};
export function historyPlan(snapshot:Snapshot,quotes:DailyQuotes|null){
 const end=(snapshot.fundHistory??[]).map(p=>p.date).sort().at(-1);
 if(!end)return {from:"",to:"",window:"",pending:[] as HistoryTask[]};
 const d=new Date(end+"T12:00:00Z");d.setUTCFullYear(d.getUTCFullYear()-2);d.setUTCDate(d.getUTCDate()-7);const recent=d.toISOString().slice(0,10);
 const starts=snapshot.ledger?([1,2,3] as const).map(f=>bankControl(snapshot.ledger!,f).from).filter((d):d is string=>!!d):[];
 const first=starts.sort()[0]??recent;
 const from=new Date(Date.parse(first)-7*86400000).toISOString().slice(0,10);
 const instruments=new Map(snapshot.positions.map(p=>[`${p.ticker}:${p.currency}`,p]));
 for(const p of quotes?.historicalInstruments??[])instruments.set(`${p.ticker}:${p.currency}`,p);
 const wanted=new Map<string,{fund:1|2|3;symbol:string;currency:string;description:string}>();
 for(const fund of [1,2,3] as const){
  if(snapshot.ledger)for(const h of holdingsAt(snapshot.ledger,fund,from).holdings.values())if(h.assetClass==="stock")wanted.set(`${h.symbol}:${h.currency}`,{fund,...h,description:h.symbol});
 }
 for(const e of snapshot.ledger?.broker??[])if(e.date>=from&&e.date<=end&&["Buy","Sell","Ankerpositie"].includes(e.kind)&&e.symbol&&e.assetClass!=="bond")wanted.set(`${e.symbol}:${e.currency}`,e);
 for(const [id,p] of wanted)if(!instruments.has(id)&&p.currency==="USD"&&/^[A-Z][A-Z0-9.]{0,9}$/.test(p.symbol))instruments.set(id,{fund:p.fund,ticker:p.symbol,currency:p.currency,exchange:"US listed",quantity:0,name:p.description,isin:"",tradingViewSymbol:""});
 const index:Position={fund:1,ticker:"GSPC.INDX",currency:"USD",exchange:"INDX",quantity:0,name:"S&P 500",isin:"",tradingViewSymbol:""};
 const window=`${from}:${end}`,windows:{from:string;to:string}[]=[];
 // Keep completed recent windows intact; every older page has <=900 calendar days.
 let cursor=from;
 while(cursor<recent){const next=new Date(Date.parse(cursor)+900*86400000).toISOString().slice(0,10);const boundary=[next,recent].sort()[0];windows.push({from:cursor,to:new Date(Date.parse(boundary)-86400000).toISOString().slice(0,10)});cursor=boundary;}
 windows.push({from:from>recent?from:recent,to:end});
 const pending:HistoryTask[]=[];
 for(const w of windows){
  const key=`${w.from}:${w.to}`;
  for(const p of [index,...instruments.values()]){
   const id=`${p.ticker}:${p.currency}`;
   if(quotes?.dailyHistoryWindows?.[id]===key||quotes?.dailyHistoryWindows?.[`${id}|${key}`]===key)continue;
   const needed=p.exchange==="INDX"||w.to===end&&snapshot.positions.some(s=>s.ticker===p.ticker&&s.currency===p.currency)||(snapshot.ledger?.broker??[]).some(e=>e.symbol===p.ticker&&e.currency===p.currency&&e.date>=w.from&&e.date<=w.to&&["Buy","Sell"].includes(e.kind))||snapshot.ledger&&([1,2,3] as const).some(f=>(holdingsAt(snapshot.ledger!,f,w.from).holdings.get(p.ticker)?.quantity??0)>0);
   if(needed)pending.push({...p,historyFrom:w.from,historyTo:w.to,historyWindow:key});
  }
 }
 return {from,to:end,window,pending};
}

/** A single symbol, one bounded page, and no retries: two years fits below 1000 rows. */
export async function fetchHistoryInstrument(p:Position,key:string,from:string,to:string,legacy=false):Promise<{instrument:Position;points:PricePoint[]}>{
 const isIndex=p.exchange==="INDX";
 const useLegacy=legacy&&(p.currency==="USD"||isIndex);
 const mic=isIndex?"INDX":venueOverride[p.ticker]||exchanges[p.exchange];
 const symbol=mic&&!isIndex&&!['XNAS','XNYS','XASE'].includes(mic)?p.marketSymbol||`${p.ticker}.${mic}`:p.ticker;
 const url=new URL(`https://api.marketstack.com/${isIndex||useLegacy?"v1":"v2"}/eod`);url.searchParams.set("access_key",key);url.searchParams.set("symbols",symbol);url.searchParams.set("date_from",from);url.searchParams.set("date_to",to);url.searchParams.set("limit","1000");
 if(mic&&['XNAS','XNYS','XASE'].includes(mic))url.searchParams.set("exchange",mic);
 const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error("Historische koersbron niet beschikbaar.");
 const body=await response.json();if(!Array.isArray(body.data)||body.pagination?.total>1000)throw Error("Historische antwoordgrens bereikt.");
 let observedMic=mic;
 const points:PricePoint[]=[];
 for(const row of body.data){
  const venue=String(row.exchange??"").toUpperCase(),currency=String(row.price_currency??(useLegacy&&["XNAS","XNYS","XASE"].includes(venue)?"USD":"")).toUpperCase();if(String(row.symbol??"").toUpperCase()!==symbol.toUpperCase()||!isIndex&&currency!==p.currency)continue;
  if(mic?venue!==mic:!['XNAS','XNYS','XASE'].includes(venue))continue;
  if(observedMic&&observedMic!==venue)throw Error("Meerdere beurzen in koershistorie.");observedMic=venue;
  const date=String(row.date??"").slice(0,10),close=Number(row.close),adjustedClose=Number(row.adj_close);
  if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&date>=from&&date<=to&&close>0&&Number.isFinite(close))points.push({date,close,...(adjustedClose>0&&Number.isFinite(adjustedClose)?{adjustedClose}:{})});
 }
 if(!points.length)throw Error("Geen passende historische koersen.");
 const exchange=p.exchange==="US listed"?Object.entries(exchanges).find(([,v])=>v===observedMic)?.[0]??p.exchange:p.exchange;
 return {instrument:{...p,exchange},points:points.sort((a,b)=>a.date.localeCompare(b.date))};
}
