import {fetchHistoryInstrument} from "./history-backfill";
import {quoteKey} from "./marketstack";
import type {DailyQuotes,Position,Snapshot} from "./types";
/** Daily task or an explicitly budget-confirmed board repair; never import, login or charts. */
export async function fillRiskHistory(snapshot:Snapshot,quotes:DailyQuotes,key:string,claim:(instrument:string)=>Promise<boolean>,checkpoint:()=>Promise<void>,now=new Date(),maxAttempts=3){
 if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>3)throw Error("Historiebudget moet tussen 1 en 3 liggen.");
 const end=new Date(now.getTime()-86400000).toISOString().slice(0,10),start=new Date(Date.parse(end)-365*86400000).toISOString().slice(0,10);
 const index:Position={fund:1,ticker:"GSPC.INDX",currency:"USD",exchange:"INDX",quantity:0,name:"S&P 500",isin:"",tradingViewSymbol:""};
 const unique=[...new Map(snapshot.positions.map(p=>[quoteKey(p),p])).values()];
 // Prioritise shared holdings so one history request helps several funds.
 unique.sort((a,b)=>snapshot.positions.filter(p=>quoteKey(p)===quoteKey(b)).length-snapshot.positions.filter(p=>quoteKey(p)===quoteKey(a)).length);
 const instruments=[index,...unique];
 let attempts=0;
 for(const p of instruments){
  if(attempts>=maxAttempts)break; // Bound runtime as well as the 100-credit monthly budget.
  const id=p.exchange==="INDX"?"benchmark":quoteKey(p),rows=(p.exchange==="INDX"?quotes.benchmark?.points:quotes.history?.[id])??[];
  const recent=rows.filter(r=>r.date>=start&&r.date<=end);
  if(recent.length>=201&&Date.parse(recent.at(-1)!.date)-Date.parse(recent[0].date)>=330*86400000)continue;
  const legacy=p.currency==="USD"&&["Nasdaq","New York Stock Exchange","NYSE American"].includes(p.exchange);
  if(!await claim(`${id}:${p.currency}:${p.marketSymbol??p.ticker}${legacy?":legacy-venue-2":""}`))continue;
  attempts++;
  try{
   const fetched=await fetchHistoryInstrument(p,key,start,end,legacy),points=[...new Map([...rows,...fetched.points].map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
   if(p.exchange==="INDX")quotes.benchmark={name:"S&P 500",points,latest:points.at(-1)??null};
   else quotes.history={...quotes.history,[id]:points};
   await checkpoint();
  }catch{/* The attempt remains reserved; no immediate paid retry. Next month may retry. */}
 }
 return attempts;
}
