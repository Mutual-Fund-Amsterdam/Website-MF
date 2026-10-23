import {fetchHistoryInstrument} from "./history-backfill";
import {quoteKey} from "./marketstack";
import type {DailyQuotes,Position,Snapshot} from "./types";
/** Called only inside the already claimed daily task; never by import, login or charts. */
export async function fillRiskHistory(snapshot:Snapshot,quotes:DailyQuotes,key:string,claim:(instrument:string)=>Promise<boolean>,checkpoint:()=>Promise<void>,now=new Date()){
 const end=new Date(now.getTime()-86400000).toISOString().slice(0,10),start=new Date(Date.parse(end)-365*86400000).toISOString().slice(0,10);
 const index:Position={fund:1,ticker:"GSPC.INDX",currency:"USD",exchange:"INDX",quantity:0,name:"S&P 500",isin:"",tradingViewSymbol:""};
 const instruments=[index,...new Map(snapshot.positions.map(p=>[quoteKey(p),p])).values()];
 let attempts=0;
 for(const p of instruments){
  if(attempts>=3)break; // Bound runtime as well as the 100-credit monthly budget.
  const id=p.exchange==="INDX"?"benchmark":quoteKey(p),rows=(p.exchange==="INDX"?quotes.benchmark?.points:quotes.history?.[id])??[];
  const recent=rows.filter(r=>r.date>=start&&r.date<=end);
  if(recent.length>=201&&Date.parse(recent.at(-1)!.date)-Date.parse(recent[0].date)>=330*86400000)continue;
  if(!await claim(`${id}:${p.currency}:${p.marketSymbol??p.ticker}`))continue;
  attempts++;
  try{
   const fetched=await fetchHistoryInstrument(p,key,start,end),points=[...new Map([...rows,...fetched.points].map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
   if(p.exchange==="INDX")quotes.benchmark={name:"S&P 500",points,latest:points.at(-1)??null};
   else quotes.history={...quotes.history,[id]:points};
   await checkpoint();
  }catch{/* The attempt remains reserved; no immediate paid retry. Next month may retry. */}
 }
 return attempts;
}
