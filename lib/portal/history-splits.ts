import type {DailyQuotes,FundNumber,Snapshot} from "./types";
import {holdingsAt} from "./ledger.ts";

// Public issuer disclosures. These model adjustments never write to the source ledger.
const disclosed=[
 {symbol:"CRWD",date:"2026-07-02",factor:4,source:"https://ir.crowdstrike.com/news-releases/news-release-details/crowdstrike-reports-first-quarter-fiscal-year-2027-financial/"},
 {symbol:"IBKR",date:"2025-06-18",factor:4,source:"https://www.sec.gov/Archives/edgar/data/1381197/000138119725000078/ibkr-8k_20250630er.htm"},
 {symbol:"PANW",date:"2024-12-16",factor:2,source:"https://paloaltonetworks.gcs-web.com/investor-resources/investor-faqs"},
 {symbol:"AVTX",date:"2025-05-22",factor:.1,source:"https://avantium.com/wp-content/uploads/2026/03/Avantium-2025-Annual-report.pdf"},
];
export type ModelSplit={symbol:string;date:string;factor:number};
/** Some provider series change their price basis a few days before the legal ex-date.
 * Bind a correction only to a disclosed split and a matching observed price discontinuity. */
export function modelSplits(snapshot:Snapshot,quotes:DailyQuotes):ModelSplit[]{
 const result=disclosed.map(action=>{
  const meta=quotes.historicalInstruments?.find(p=>p.ticker===action.symbol)??snapshot.positions.find(p=>p.ticker===action.symbol);
  const rows=meta?quotes.history?.[`${meta.exchange}:${meta.ticker.toUpperCase()}`]??[]:[];
  const candidates=rows.slice(1).map((p,i)=>({date:p.date,ratio:p.close/rows[i].close,previous:rows[i].date})).filter(p=>Math.abs(Date.parse(p.date)-Date.parse(action.date))<=7*86400000&&Date.parse(p.date)-Date.parse(p.previous)<=7*86400000&&Math.abs(Math.log(p.ratio*action.factor))<Math.log(1.4));
  candidates.sort((a,b)=>Math.abs(Date.parse(a.date)-Date.parse(action.date))-Math.abs(Date.parse(b.date)-Date.parse(action.date)));
  return {symbol:action.symbol,date:candidates[0]?.date??action.date,factor:action.factor};
 });
 // Proper total-return closes also identify historical price-basis changes for
 // older instruments. These inferred factors are model inputs, not ledger approvals.
 const instruments=new Map([...snapshot.positions,...(quotes.historicalInstruments??[])].map(p=>[`${p.ticker}:${p.currency}`,p]));
 const factors=[2,3,4,5,10,15,20,25,50,100,1/2,1/3,1/4,1/5,1/10,1/15,1/20,1/25,1/50,1/100];
 for(const meta of instruments.values()){
  const rows=quotes.history?.[`${meta.exchange}:${meta.ticker.toUpperCase()}`]??[];
  for(let i=1;i<rows.length;i++){
   const a=rows[i-1],b=rows[i];if(!a.adjustedClose||!b.adjustedClose||Date.parse(b.date)-Date.parse(a.date)>7*86400000)continue;
   const raw=b.close/a.close,implied=(b.adjustedClose/a.adjustedClose)/raw;
   const factor=factors.find(f=>Math.abs(implied/f-1)<.01&&Math.abs(Math.log(raw*f))<Math.log(1.4));
   if(factor&&!result.some(s=>s.symbol===meta.ticker&&Math.abs(Date.parse(s.date)-Date.parse(b.date))<=7*86400000))result.push({symbol:meta.ticker,date:b.date,factor});
  }
 }
 return result;
}

export function splitSafeReturn(before:{close:number;adjustedClose?:number},after:{close:number;adjustedClose?:number},factor=1):number{
 const raw=after.close/before.close,adjusted=(after.adjustedClose??after.close)/(before.adjustedClose??before.close);
 // Legacy and current feeds can use different cumulative adjustment bases.
 // A basis change without a corresponding raw-price event is not a market return.
 if(factor===1&&Math.abs(Math.log(adjusted/raw))>Math.log(1.4)&&Math.abs(Math.log(raw))<Math.log(1.4))return raw;
 // A real adjusted total-return series already includes the split. Do not adjust twice.
 return factor!==1&&Math.abs(Math.log(raw*factor))<Math.log(1.4)&&Math.abs(Math.log(adjusted/raw))<.02?adjusted*factor:adjusted;
}

export function modelHoldingsAt(snapshot:Snapshot,fund:FundNumber,date:string,splits:ModelSplit[]){
 const result=holdingsAt(snapshot.ledger!,fund,date),anchor=result.anchor;if(!anchor)return result.holdings;
 const reverse=date<anchor,from=reverse?date:anchor,to=reverse?anchor:date;
 for(const symbol of new Set(splits.map(s=>s.symbol))){
  const source=snapshot.ledger!.broker.find(e=>e.fund===fund&&e.kind==="Ankerpositie"&&e.symbol===symbol);
  const events=snapshot.ledger!.broker.filter(e=>e.fund===fund&&e.symbol===symbol&&e.date>from&&e.date<=to);
  const actions=splits.filter(s=>s.symbol===symbol&&s.date>from&&s.date<=to);
  if(!actions.length||events.some(e=>e.processing==="Split"&&e.status.toLowerCase()==="goedgekeurd"))continue;
  const rows=[...events.filter(e=>["Buy","Sell"].includes(e.kind)).map(e=>({date:e.date,quantity:e.quantity??0,factor:1,order:1})),...actions.map(s=>({date:s.date,quantity:0,factor:s.factor,order:0}))].sort((a,b)=>a.date.localeCompare(b.date)||a.order-b.order);
  if(reverse)rows.reverse();let quantity=source?.quantity??0;
  for(const e of rows)quantity=e.factor!==1?quantity*(reverse?1/e.factor:e.factor):quantity+(reverse?-1:1)*e.quantity;
  const meta=result.holdings.get(symbol)??(source?{symbol,currency:source.currency,quantity:0,assetClass:source.assetClass,exchange:source.exchange}:null);
  if(meta)result.holdings.set(symbol,{...meta,quantity});
 }
 return result.holdings;
}
