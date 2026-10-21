import { NextResponse } from "next/server";
import { clearSession, sameOrigin } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 403 });
  try { await clearSession(); } catch { /* An expired session can still be cleared in the browser. */ }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
