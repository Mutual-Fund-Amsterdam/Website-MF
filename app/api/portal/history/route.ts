import {NextResponse} from "next/server";
import {getMemberSession,getDailyQuotes,saveDailyQuotes,sameOrigin,reserveMarketstackCalls,setHistoryUsageBaseline,historyBatchLock,releaseHistoryBatch} from "@/lib/portal/store";
import {historyPlan,fetchHistoryInstrument} from "@/lib/portal/history-backfill";
import {refreshWindow,quoteKey} from "@/lib/portal/marketstack";
import {fetchCurrencyHistory} from "@/lib/portal/ecb";
export const runtime="nodejs";
export const maxDuration=60;
const headers={"Cache-Control":"no-store"};
export async function POST(request:Request){
 if(!sameOrigin(request))return NextResponse.json({error:"Geen toegang."},{status:403,headers});
 const session=await getMemberSession();if(!session||session.member.role.toLowerCase()!=="hoofdbestuurder")return NextResponse.json({error:"Geen toegang."},{status:403,headers});
 const body=await request.json().catch(()=>null);if(!body||!["plan","batch"].includes(body.action))return NextResponse.json({error:"Ongeldige opdracht."},{status:400,headers});
 const quotes=await getDailyQuotes(),plan=historyPlan(session.snapshot,quotes);
 if(body.action==="plan")return NextResponse.json({from:plan.from,to:plan.to,remaining:plan.pending.length,maxCallsPerBatch:3},{headers});
 if(!process.env.MARKETSTACK_API_KEY||!quotes)return NextResponse.json({error:"Koersbron ontbreekt."},{status:503,headers});
 if(refreshWindow())return NextResponse.json({error:"Dagelijkse updatevenster; probeer later."},{status:409,headers});
 if(!await historyBatchLock())return NextResponse.json({error:"Een historische batch is al bezig."},{status:409,headers});
 try{
  if(body.usageBaseline!==undefined)await setHistoryUsageBaseline(body.usageBaseline);
  const currencies=[...new Set(plan.pending.map(p=>p.currency).filter(c=>c!=="EUR"&&c!=="USD"))];
  for(const c of currencies)if(!quotes.fxHistory?.[c]?.length){try{quotes.fxHistory={...quotes.fxHistory,[c]:await fetchCurrencyHistory(c)};}catch{/* Unavailable FX remains a disclosed model uncertainty. */}}
  let attempted=0,loaded=0;
  for(const p of plan.pending.slice(0,3)){
   await reserveMarketstackCalls(1,true);attempted++;
   // Persist attempts before sending. A failed or interrupted request is not replayed.
   quotes.dailyHistoryWindows={...quotes.dailyHistoryWindows,[`${p.ticker}:${p.currency}|${p.historyWindow}`]:p.historyWindow};
   quotes.historyUpdatedAt=new Date().toISOString();await saveDailyQuotes(quotes);
   try{
    const {historyFrom,historyTo,historyWindow,...instrument}=p;
    const fresh=await fetchHistoryInstrument(instrument,process.env.MARKETSTACK_API_KEY,historyFrom,historyTo,historyTo<"2024-10-01"),id=quoteKey(fresh.instrument);
    if(p.exchange==="INDX"){
     const points=[...new Map([...(quotes.benchmark?.points??[]),...fresh.points].map(p=>[p.date,p])).values()].sort((a,b)=>a.date.localeCompare(b.date));
     quotes.benchmark={name:"S&P 500",points,latest:points.at(-1)??null};
    }else{
    quotes.history={...quotes.history,[id]:[...new Map([...(quotes.history?.[id]??[]),...fresh.points].map(p=>[p.date,p])).values()].sort((a,b)=>a.date.localeCompare(b.date))};
    quotes.historicalInstruments=[...(quotes.historicalInstruments??[]).filter(x=>!(x.ticker===p.ticker&&x.currency===p.currency)),fresh.instrument];
    }loaded++;
   }catch{quotes.historyBackfillIssues=[...new Set([...(quotes.historyBackfillIssues??[]),`${p.ticker}: ontbrekende daghistorie`])];}
   quotes.historyUpdatedAt=new Date().toISOString();await saveDailyQuotes(quotes);
  }
  return NextResponse.json({attempted,loaded,remaining:historyPlan(session.snapshot,quotes).pending.length},{headers});
 }catch{return NextResponse.json({error:"Historische batch gestopt; controleer koersbudget."},{status:400,headers});}
 finally{await releaseHistoryBatch();}
}
