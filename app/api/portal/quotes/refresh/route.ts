import { NextResponse } from "next/server";
import { fetchEcbRates } from "@/lib/portal/ecb";
import { fetchDailyQuotes } from "@/lib/portal/marketstack";
import { claimDailyRefresh, configured, getDailyQuotes, getSnapshot, releaseDailyRefresh, saveDailyQuotes } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Geen toegang." }, { status: 401, headers });
  }
  if (!configured() || !process.env.MARKETSTACK_API_KEY) {
    return NextResponse.json({ error: "Koersbron is nog niet ingericht." }, { status: 503, headers });
  }
  const local = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  const [today, time] = local.split(" ");
  if (time < "17:15") return NextResponse.json({ skipped: "Wacht tot 17:15 Amsterdamse tijd." }, { headers });
  if (!await claimDailyRefresh(today)) return NextResponse.json({ skipped: "Dagelijkse verversing is al gestart." }, { headers });
  try {
    const snapshot = await getSnapshot();
    if (!snapshot) {
      await releaseDailyRefresh(today);
      return NextResponse.json({ error: "Geen fondsgegevens geïmporteerd." }, { status: 503, headers });
    }
    const previous = await getDailyQuotes();
    const quotes = await fetchDailyQuotes(snapshot.positions, process.env.MARKETSTACK_API_KEY, previous);
    try { quotes.fx = await fetchEcbRates(); } catch { quotes.fx = previous?.fx; }
    await saveDailyQuotes(quotes);
    return NextResponse.json({ updated: Object.keys(quotes.prices).length, fetchedAt: quotes.fetchedAt }, { headers });
  } catch {
    await releaseDailyRefresh(today);
    return NextResponse.json({ error: "Dagelijkse koersen konden niet worden vernieuwd." }, { status: 502, headers });
  }
}
