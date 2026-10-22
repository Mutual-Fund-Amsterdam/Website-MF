import { NextResponse } from "next/server";
import { fetchDailyQuotes, quoteKey } from "@/lib/portal/marketstack";
import { allowAttempt, claimDailyRefresh, configured, getDailyQuotes, getMemberSession, getSnapshot, recordFundDailyValues, releaseDailyRefresh, sameOrigin, saveDailyQuotes } from "@/lib/portal/store";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!sameOrigin(request)) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 403, headers });
  if (!configured() || !process.env.MARKETSTACK_API_KEY) return NextResponse.json({ error: "Koersbron ontbreekt." }, { status: 503, headers });
  const session = await getMemberSession();
  if (session?.member.role.toLowerCase() !== "hoofdbestuurder") return NextResponse.json({ error: "Geen toegang." }, { status: 403, headers });
  if (!await allowAttempt(request, "import")) return NextResponse.json({ error: "Te veel aanvragen." }, { status: 429, headers });
  if (!await claimDailyRefresh("manual-history-backfill")) return NextResponse.json({ error: "Historie wordt al geladen." }, { status: 409, headers });
  try {
    const snapshot = await getSnapshot();
    const previous = await getDailyQuotes();
    if (!snapshot || !previous) return NextResponse.json({ error: "Fondsgegevens of koersen ontbreken." }, { status: 503, headers });
    const quotes = await fetchDailyQuotes(snapshot.positions, process.env.MARKETSTACK_API_KEY!, previous);
    quotes.fx = previous.fx;
    await saveDailyQuotes(quotes);
    await recordFundDailyValues(snapshot, quotes);
    const completed = new Set(quotes.historyBackfilled);
    const symbols = new Set(snapshot.positions.map(quoteKey));
    const remaining = [...symbols].filter((symbol) => !completed.has(symbol)).length;
    return NextResponse.json({ remaining, loaded: symbols.size - remaining, benchmark: completed.has("GSPC.INDX") }, { headers });
  } catch {
    return NextResponse.json({ error: "Historische koersen konden niet worden geladen." }, { status: 502, headers });
  } finally {
    await releaseDailyRefresh("manual-history-backfill");
  }
}

