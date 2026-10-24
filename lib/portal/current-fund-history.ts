import type {DailyQuotes,FundHistoryPoint,FundNumber,Position,Snapshot} from "./types";
import {quoteKey} from "./marketstack";

const DAY=86400000;
/** Internal transfers remain assets. Never divide an incomplete broker book by
 * the full administration's units; reconcile the receiving book first. */
export function currentBookIssues(snapshot:Snapshot,fund:FundNumber):string[]{
 const last=(snapshot.fundHistory??[]).filter(p=>p.fund===fund).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
 if(!last)return [];
 const rows=(snapshot.ledger?.bank??[]).filter(e=>e.fund===fund&&e.date>last.date);
 const issues:string[]=[];
 if(rows.some(e=>e.kind==="Saxo ontbreekt"))issues.push("Saxo-stand ontbreekt");
 if(rows.some(e=>e.kind==="Tussen fondsen"&&e.status.trim().toLowerCase()!=="goedgekeurd"))issues.push("Overboeking tussen fondsen nog niet afgestemd");
 return issues;
}
/** Dated valuations of the supplied book. These are model anchors, never approved administration. */
export function currentFundHistory(snapshot:Snapshot,quotes:DailyQuotes,fund:FundNumber):FundHistoryPoint[]{
 if(currentBookIssues(snapshot,fund).length)return [];
 const reported=(snapshot.fundHistory??[]).filter(p=>p.fund===fund).sort((a,b)=>a.date.localeCompare(b.date));
 const sourceDates=[snapshot.requestedDate,...(snapshot.cash??[]).filter(c=>c.fund===fund).flatMap(c=>[c.ingAsOf,c.brokerAsOf]),...(snapshot.ledger?.bank??[]).filter(e=>e.fund===fund&&e.kind==="Banksluiting").map(e=>e.date)].filter((d):d is string=>!!d);
 const cutoff=snapshot.input?.cutoff??sourceDates.sort().at(-1);
 if(!cutoff)return [];
 const last=reported.at(-1),cash=snapshot.cash?.find(c=>c.fund===fund);
 if(!last||!cash||!cutoff||cutoff<last.date)return [];
 const moves=(snapshot.ledger?.broker??[]).filter(e=>e.fund===fund&&e.source==="Invoer"&&["Buy","Sell"].includes(e.kind)&&e.date>cutoff);
 const positions=new Map(snapshot.positions.filter(p=>p.fund===fund).map(p=>[`${p.ticker}:${p.currency}`,p]));
 for(const e of moves)if(!positions.has(`${e.symbol}:${e.currency}`)){
  const meta=quotes.historicalInstruments?.find(p=>p.ticker===e.symbol&&p.currency===e.currency);
  if(!meta&&!e.exchange)return [];
  positions.set(`${e.symbol}:${e.currency}`,{...meta,fund,ticker:e.symbol,currency:e.currency,exchange:meta?.exchange??e.exchange,quantity:0,name:meta?.name??e.symbol,isin:"",tradingViewSymbol:""} as Position);
 }
 const latest=(p:Position)=>[...(quotes.history?.[quoteKey(p)]??[]),...(quotes.prices[quoteKey(p)]?[quotes.prices[quoteKey(p)]]:[])].sort((a,b)=>a.date.localeCompare(b.date)).at(-1)?.date;
 const ends=[quotes.benchmark?.latest?.date??quotes.benchmark?.points.at(-1)?.date,...[...positions.values()].filter(p=>p.quantity>0).map(latest)];
 if(ends.some(d=>!d))return [];
 const end=(ends as string[]).sort()[0];
 const dates=[...new Set([cutoff,...(quotes.benchmark?.points??[]).map(p=>p.date)])].filter(d=>d>=cutoff&&d>last.date&&d<=end).sort();
 const rate=(currency:string,date:string)=>{
  if(currency==="EUR")return 1;
  const p=(currency==="USD"?quotes.eurUsdHistory??quotes.fxHistory?.USD:quotes.fxHistory?.[currency])?.filter(p=>p.date<=date).at(-1);
  return p&&p.close>0&&Date.parse(date)-Date.parse(p.date)<=8*DAY?p.close:null;
 };
 const result:FundHistoryPoint[]=[];
 for(const date of dates){
  let value=0,valid=true;
  for(const p of positions.values()){
   const quantity=p.quantity-moves.filter(e=>e.symbol===p.ticker&&e.currency===p.currency&&e.date>date).reduce((s,e)=>s+(e.quantity??0),0);
   if(Math.abs(quantity)<1e-8)continue;
   const rows=[...(quotes.history?.[quoteKey(p)]??[]),...(quotes.prices[quoteKey(p)]?[quotes.prices[quoteKey(p)]]:[])].filter(r=>r.date<=date).sort((a,b)=>a.date.localeCompare(b.date));
   const point=rows.at(-1),fx=rate(p.currency,date);
   if(quantity<0||!point||!fx||Date.parse(date)-Date.parse(point.date)>7*DAY){valid=false;break;}
   value+=quantity*point.close/fx;
  }
  const balances:Record<string,number>={EUR:(cash.ingEur??NaN)+(cash.brokerEur??NaN),USD:cash.brokerUsd??0,CAD:cash.brokerCad??0};
  for(const [currency,balance] of Object.entries(cash.extraBalances??{}))balances[currency]=(balances[currency]??0)+balance.amount;
  for(const e of moves.filter(e=>e.date>date)){
   const delta=e.cashDelta??e.nativeCash;if(delta===null||delta===undefined){valid=false;break;}
   const currency=e.cashCurrency||e.currency;balances[currency]=(balances[currency]??0)-delta;
  }
  for(const e of snapshot.transactions??[])if(e.fund===fund&&e.date>date&&e.source.startsWith("Invoer:"))balances.EUR-=e.amount;
  for(const [currency,amount] of Object.entries(balances)){
   if(amount===0)continue;
   const fx=rate(currency,date);if(!fx||!Number.isFinite(amount)){valid=false;break;}value+=amount/fx;
  }
  value+=cash.otherEur??0;
  const base=reported.filter(p=>p.date<=date).at(-1)!;
  const units=base.totalUnits+(snapshot.transactions??[]).filter(e=>e.fund===fund&&e.date>base.date&&e.date<=date).reduce((s,e)=>s+e.units,0);
  if(valid&&units>0&&value>0)result.push({fund,date,nav:value/units,totalUnits:units});
 }
 return result;
}
