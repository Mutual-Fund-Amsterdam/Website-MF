import type {DailyQuote,DailyQuotes,Position,PricePoint} from "./types";
import {FUND_RETURN_BASELINE} from "./comparison.ts";

const exchangeMic:Record<string,string>={"Euronext Amsterdam":"XAMS","Euronext Paris":"XPAR","NYSE American":"XASE",Nasdaq:"XNAS","New York Stock Exchange":"XNYS","Toronto Stock Exchange":"XTSE","Vienna Stock Exchange":"XWBO"};
const providerVenue:Record<string,string>={LEU:"XNYS",CEG:"XNYS",PANW:"XNYS",WMT:"XNYS"};
const INDEX_SYMBOL="GSPC.INDX";
type Charge=(cost:number,historical?:boolean)=>Promise<number>;
export const DAILY_REFRESH_UTC_HOUR=5;
export const DAILY_REFRESH_UTC_MINUTE=15;
export function quoteKey(position:Pick<Position,"ticker"|"exchange">):string{return `${position.exchange}:${position.ticker.toUpperCase()}`;}
export function refreshWindow(now=new Date()):boolean{return now.getUTCHours()===DAILY_REFRESH_UTC_HOUR&&now.getUTCMinutes()>=DAILY_REFRESH_UTC_MINUTE||now.getUTCHours()===6&&now.getUTCMinutes()<15;}
function symbolFor(p:Position,mic:string):string{return ["XNAS","XNYS","XASE"].includes(mic)?p.ticker:p.marketSymbol||`${p.ticker}.${mic}`;}
function merge(old:PricePoint[]=[],fresh:PricePoint[]=[]):PricePoint[]{return [...new Map([...old,...fresh].map(p=>[p.date,p])).values()].sort((a,b)=>a.date.localeCompare(b.date));}

/** One EOD snapshot per symbol. No pagination, history downloads or per-member requests. */
export async function fetchDailyQuotes(positions:Position[],key:string,previous:DailyQuotes|null,charge?:Charge,now=new Date()):Promise<DailyQuotes>{
 const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Amsterdam",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const unique=new Map(positions.map(p=>[quoteKey(p),p]));if(unique.size>80)throw new Error("Meer dan 80 beursposities; controleer eerst het abonnement.");
 const groups=new Map<string,Position[]>();for(const p of unique.values()){const mic=providerVenue[p.ticker.toUpperCase()]??exchangeMic[p.exchange];if(!mic)throw new Error("Beurscode ontbreekt.");groups.set(mic,[...(groups.get(mic)??[]),p]);}
 let calls=0;const cap=unique.size+1;
 const request=async(url:URL,cost:number)=>{
  if(calls+cost>cap)throw new Error("Daglimiet koersaanvragen bereikt.");
  if(charge)await charge(cost,false);calls+=cost;
  const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`Koersbron gaf status ${response.status}.`);
  const body:unknown=await response.json();
  if(!body||typeof body!=="object"||!("data" in body)||!Array.isArray(body.data))throw new Error("Geen geldige koerslijst.");
  return body.data as Record<string,unknown>[];
 };
 const point=(r:Record<string,unknown>):PricePoint|null=>{const date=String(r.date??"").slice(0,10),close=Number(r.close);return /^\d{4}-\d{2}-\d{2}$/.test(date)&&date<today&&Number.isFinite(close)&&close>0?{date,close}:null;};
 const prices:Record<string,DailyQuote>={...previous?.prices},history:Record<string,PricePoint[]>={...previous?.history};
 for(const [mic,group] of groups){
  const lookup=new Map(group.map(p=>[symbolFor(p,mic).toUpperCase(),p]));
  const url=new URL("https://api.marketstack.com/v2/eod/latest");url.searchParams.set("access_key",key);url.searchParams.set("symbols",[...lookup.keys()].join(","));url.searchParams.set("limit","1000");if(["XNAS","XNYS","XASE"].includes(mic))url.searchParams.set("exchange",mic);
  for(const r of await request(url,lookup.size)){
   const p=lookup.get(String(r.symbol??"").toUpperCase()),fresh=point(r);
   if(!p||!fresh||String(r.exchange??"").toUpperCase()!==mic||String(r.price_currency??"").toUpperCase()!==p.currency.toUpperCase())continue;
   const id=quoteKey(p);history[id]=merge(history[id],[fresh]);
   const last=history[id].at(-1)!;prices[id]={symbol:p.ticker,exchange:mic,currency:p.currency,...last};
  }
 }
 let benchmark=previous?.benchmark;
 try{
  // Fill the fixed meeting baseline in the same single index request, without extra calls.
  const hasStart=previous?.benchmark?.points.some(p=>p.date===FUND_RETURN_BASELINE);
  const from=hasStart?new Date(now.getTime()-10*86400000).toISOString().slice(0,10):FUND_RETURN_BASELINE;
  const url=new URL("https://api.marketstack.com/v1/eod");url.searchParams.set("access_key",key);url.searchParams.set("symbols",INDEX_SYMBOL);url.searchParams.set("limit","1000");url.searchParams.set("date_from",from);
  const fresh=(await request(url,1)).filter(r=>String(r.symbol??"").toUpperCase()===INDEX_SYMBOL&&String(r.exchange??"").toUpperCase()==="INDX").map(point).filter((p):p is PricePoint=>p!==null);
  const points=merge(benchmark?.points,fresh);benchmark={name:"S&P 500",points,latest:points.at(-1)??null};
 }catch{/* Retain the actual last available index date. No retry or invented observation. */}
 return {...previous,fetchedAt:now.toISOString(),prices,history,benchmark};
}
