import {NextResponse} from "next/server";
import {allowAttempt,claimRiskHistoryCredit,getDailyQuotes,getMemberSession,historyBatchLock,operations,recordOperation,refreshRiskReport,releaseHistoryBatch,sameOrigin,saveDailyQuotes} from "@/lib/portal/store";
import {fillRiskHistory} from "@/lib/portal/risk-history";
import {refreshWindow} from "@/lib/portal/marketstack";
export const runtime="nodejs";
export const maxDuration=120;
const headers={"Cache-Control":"no-store"};
/** Explicit board-confirmed repair only. Never called by a page, login or import. */
export async function POST(request:Request){
 if(!sameOrigin(request))return NextResponse.json({error:"Geen toegang."},{status:403,headers});
 const session=await getMemberSession();if(!session||session.member.role.toLowerCase()!=="hoofdbestuurder")return NextResponse.json({error:"Geen toegang."},{status:403,headers});
 if(!await allowAttempt(request,"import"))return NextResponse.json({error:"Probeer later opnieuw."},{status:429,headers});
 const body=await request.json().catch(()=>null);
 if(body?.action!=="confirmed-risk-repair"||!Number.isInteger(body.confirmedBudget)||body.confirmedBudget<1||body.confirmedBudget>3)return NextResponse.json({error:"Bevestig een eenmalig historiebudget van maximaal drie credits per batch."},{status:400,headers});
 if(!process.env.MARKETSTACK_API_KEY)return NextResponse.json({error:"Koersbron ontbreekt."},{status:503,headers});
 const now=new Date(),daily=`daily:${now.toISOString().slice(0,10)}`;
 // During the cron window, only proceed after today's run has finished. Keep its lock intact.
 if(refreshWindow(now)&&!(await operations()).some(l=>l.runId===daily&&l.kind==="daily-result"))return NextResponse.json({error:"Dagelijkse taak is nog niet afgerond."},{status:409,headers});
 if(!await historyBatchLock())return NextResponse.json({error:"Een historische batch is al bezig."},{status:409,headers});
 try{
  const quotes=await getDailyQuotes();if(!quotes)return NextResponse.json({error:"Opgeslagen koersen ontbreken."},{status:503,headers});
  const context={runId:`risk-repair:${now.toISOString()}`,cause:"risk-history-confirmed"};
  const attempted=await fillRiskHistory(session.snapshot,quotes,process.env.MARKETSTACK_API_KEY,id=>claimRiskHistoryCredit(id,now,context),async()=>{quotes.historyUpdatedAt=new Date().toISOString();await saveDailyQuotes(quotes);},now,body.confirmedBudget);
  const report=await refreshRiskReport(session.snapshot,quotes);
  await recordOperation({kind:"risk-repair",...context,result:"afgerond",detail:`${attempted} historiecredits gereserveerd; dagkoersen niet opnieuw aangevraagd`});
  return NextResponse.json({attempted,funds:Object.fromEntries(([1,2,3] as const).map(f=>[f,{coverage:report.funds[f].current.coverage,available:report.funds[f].current.volatility!==null}]))},{headers});
 }catch{return NextResponse.json({error:"Historische aanvulling gestopt; geen automatische herhaling."},{status:502,headers});}
 finally{await releaseHistoryBatch();}
}
