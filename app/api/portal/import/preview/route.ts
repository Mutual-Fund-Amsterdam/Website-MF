import { mergeManualPrices } from "@/lib/portal/unit-ledger";
import { compareImports } from "@/lib/portal/import-differences";
import { NextResponse } from "next/server";
import { parseWorkbook, summarize } from "@/lib/portal/workbook";
import { allowAttempt, configured, getDailyQuotes, getMemberSession, pepper, sameOrigin, savePending } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!sameOrigin(request)) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 403, headers });
  if (!configured()) return NextResponse.json({ error: "De ledenomgeving is nog niet ingericht." }, { status: 503, headers });
  try {
    const session = await getMemberSession();
    if (session?.member.role.toLowerCase() !== "hoofdbestuurder") {
      return NextResponse.json({ error: "Alleen het ingelogde hoofdbestuur kan importeren." }, { status: 403, headers });
    }
    if (!await allowAttempt(request, "import")) return NextResponse.json({ error: "Te veel pogingen. Probeer het later opnieuw." }, { status: 429, headers });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx") || file.size > 2_000_000) {
      return NextResponse.json({ error: "Kies een .xlsx-bestand van maximaal 2 MB." }, { status: 400, headers });
    }
    const snapshot = await parseWorkbook(Buffer.from(await file.arrayBuffer()), pepper(),session.snapshot);
    if (snapshot.manualPrices?.length) mergeManualPrices(snapshot, await getDailyQuotes());
    const id = await savePending(snapshot,session.snapshot);
    return NextResponse.json({ id, digest: snapshot.digest, summary: summarize(snapshot), differences: compareImports(session.snapshot,snapshot) }, { headers });
  } catch (error) {
    const message = error instanceof Error && /koers|invoer|Kolom|tabblad|rij|cash|leden|participatie|positie|Aantal|Excelbestand|Dubbel|ontbreekt|ongeldig/i.test(error.message)
      ? error.message : "Het bestand kon niet worden gelezen. Controleer het Excelbestand.";
    return NextResponse.json({ error: message }, { status: 400, headers });
  }
}
