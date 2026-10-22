import { NextResponse } from "next/server";
import { fetchEcbRates } from "@/lib/portal/ecb";
import { fetchDailyQuotes } from "@/lib/portal/marketstack";
import { claimDailyRefresh, configured, getDailyQuotes, getSnapshot, recordFundDailyValues, releaseDailyRefresh, saveDailyQuotes } from "@/lib/portal/store";

export const runtime = "nodejs";

/** One-time launch import of the last complete closing prices; regular updates use the daily cron. */
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Geen toegang." }, { status: 401, headers });
  }
  if (!configured() || !process.env.MARKETSTACK_API_KEY) {
    return NextResponse.json({ error: "Koersbron is nog niet ingericht." }, { status: 503, headers });
  }
  const existing = await getDailyQuotes();
  if (existing && Object.keys(existing.prices).length > 0) {
    return NextResponse.json({ skipped: "Koersen zijn al geladen." }, { headers });
  }
  if (!await claimDailyRefresh("bootstrap")) {
    return NextResponse.json({ skipped: "Eerste koersimport loopt al." }, { headers });
  }
  try {
    const snapshot = await getSnapshot();
    if (!snapshot) throw new Error("Geen Excelimport beschikbaar.");
    const quotes = await fetchDailyQuotes(snapshot.positions, process.env.MARKETSTACK_API_KEY, null);
    quotes.fx = await fetchEcbRates();
    await saveDailyQuotes(quotes);
    await recordFundDailyValues(snapshot, quotes);
    return NextResponse.json({ updated: Object.keys(quotes.prices).length, fetchedAt: quotes.fetchedAt }, { headers });
  } catch {
    await releaseDailyRefresh("bootstrap");
    return NextResponse.json({ error: "Eerste koersimport is mislukt." }, { status: 502, headers });
  }
}
