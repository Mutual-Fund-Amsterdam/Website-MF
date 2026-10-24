import { NextResponse } from "next/server";
import { fetchEcbRates, fetchEurUsdHistory, fetchEstrHistory,fetchCurrencyHistory } from "@/lib/portal/ecb";
import { fetchDailyQuotes,refreshWindow } from "@/lib/portal/marketstack";
import { claimDailyRefresh, configured, getDailyQuotes, getSnapshot, recordFundDailyValues, saveDailyQuotes, reserveMarketstackCalls } from "@/lib/portal/store";
import {recordOperation} from "@/lib/portal/store";
import {maintainOneDrive} from "@/lib/portal/onedrive";
import {writeOneDriveResults} from "@/lib/portal/onedrive";
import {refreshRiskReport,claimRiskHistoryCredit} from "@/lib/portal/store";
import {fillRiskHistory} from "@/lib/portal/risk-history";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Geen toegang." }, { status: 401, headers });
  }
  if (!configured() || !process.env.MARKETSTACK_API_KEY) {
    return NextResponse.json({ error: "Koersbron is nog niet ingericht." }, { status: 503, headers });
  }
  const now=new Date();
  const today=now.toISOString().slice(0,10);
  if (!refreshWindow(now)) return NextResponse.json({ skipped: "Dagelijkse koersupdate: 05:15 UTC, eenmaal per dag." }, { headers });
  // File maintenance is independent of the paid quote job and its daily lock.
  try{await maintainOneDrive();}catch{await recordOperation({kind:"onedrive",cause:"daily",result:"onderhoud mislukt"});}
  if (!await claimDailyRefresh(today)) return NextResponse.json({ skipped: "Dagelijkse verversing is al gestart." }, { headers });
  const runId=`daily:${today}`;let credits=0;
  try {
    const snapshot = await getSnapshot();
    if (!snapshot) {
      return NextResponse.json({ error: "Geen fondsgegevens geïmporteerd." }, { status: 503, headers });
    }
    const previous = await getDailyQuotes();
    const quotes = await fetchDailyQuotes(snapshot.positions, process.env.MARKETSTACK_API_KEY, previous,async cost=>{const used=await reserveMarketstackCalls(cost,false,{runId,cause:"daily"});credits+=cost;return used;},now);
    try { quotes.fx = await fetchEcbRates(); } catch { quotes.fx = previous?.fx; }
    try { quotes.eurUsdHistory = await fetchEurUsdHistory(previous?.eurUsdHistory); } catch { quotes.eurUsdHistory = previous?.eurUsdHistory; }
    try { quotes.estrHistory = await fetchEstrHistory(previous?.estrHistory); } catch { quotes.estrHistory = previous?.estrHistory; }
    quotes.fxHistory={...previous?.fxHistory,USD:quotes.eurUsdHistory??[]};
    const currencies=[...new Set([...snapshot.positions.map(p=>p.currency),...snapshot.cash.flatMap(c=>[...(c.brokerCad?["CAD"]:[]),...Object.keys(c.extraBalances??{})]),...(snapshot.ledger?.broker??[]).map(e=>e.currency)].filter(c=>c&&c!=="EUR"&&c!=="USD"))];
    await Promise.all(currencies.map(async c=>{try{quotes.fxHistory![c]=await fetchCurrencyHistory(c,previous?.fxHistory?.[c]);}catch{/* Retain prior observations; missing data never becomes zero. */}}));
    await saveDailyQuotes(quotes);
    credits+=await fillRiskHistory(snapshot,quotes,process.env.MARKETSTACK_API_KEY,id=>claimRiskHistoryCredit(id,now),()=>saveDailyQuotes(quotes),now);
    await recordFundDailyValues(snapshot, quotes);
    await refreshRiskReport(snapshot,quotes);
    await writeOneDriveResults();
    await recordOperation({kind:"daily-result",cause:"daily",runId,result:quotes.refreshIssues?.length?"gedeeltelijk voltooid":"voltooid",detail:`${credits} credits gereserveerd${quotes.refreshIssues?.length?`; ${quotes.refreshIssues.join("; ")}`:""}`});
    return NextResponse.json({ updated: Object.keys(quotes.prices).length, fetchedAt: quotes.fetchedAt }, { headers });
  } catch {
    await recordOperation({kind:"daily-result",cause:"daily",runId,result:"afgebroken; geen automatische herhaling",detail:`${credits} credits gereserveerd`});
    // Keep the daily lock even after partial failure; retrying could spend credits twice.
    return NextResponse.json({ error: "Dagelijkse koersen konden niet worden vernieuwd." }, { status: 502, headers });
  }
}
