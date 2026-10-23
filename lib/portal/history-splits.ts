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
 return disclosed.map(action=>{
  const meta=quotes.historicalInstruments?.find(p=>p.ticker===action.symbol)??snapshot.positions.find(p=>p.ticker===action.symbol);
  const rows=meta?quotes.history?.[`${meta.exchange}:${meta.ticker.toUpperCase()}`]??[]:[];
  const candidates=rows.slice(1).map((p,i)=>({date:p.date,ratio:p.close/rows[i].close,previous:rows[i].date})).filter(p=>Math.abs(Date.parse(p.date)-Date.parse(action.date))<=7*86400000&&Date.parse(p.date)-Date.parse(p.previous)<=7*86400000&&Math.abs(Math.log(p.ratio*action.factor))<Math.log(1.4));
  candidates.sort((a,b)=>Math.abs(Date.parse(a.date)-Date.parse(action.date))-Math.abs(Date.parse(b.date)-Date.parse(action.date)));
  return {symbol:action.symbol,date:candidates[0]?.date??action.date,factor:action.factor};
 });
}

export function splitSafeReturn(before:{close:number;adjustedClose?:number},after:{close:number;adjustedClose?:number},factor=1):number{
 const raw=after.close/before.close,adjusted=(after.adjustedClose??after.close)/(before.adjustedClose??before.close);
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
