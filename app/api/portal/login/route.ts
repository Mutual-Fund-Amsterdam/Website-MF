import { NextResponse } from "next/server";
import { allowAttempt, clearAttempts, configured, createSession, findMember, getSnapshot, sameOrigin, setSessionCookie } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!sameOrigin(request)) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 403, headers });
  if (!configured()) return NextResponse.json({ error: "De ledenomgeving is nog niet ingericht." }, { status: 503, headers });
  try {
    if (!await allowAttempt(request, "login")) return NextResponse.json({ error: "Te veel pogingen. Probeer het over 15 minuten opnieuw." }, { status: 429, headers });
    const body = await request.json();
    const memberId = String(body.memberId ?? "").trim();
    const code = String(body.code ?? "");
    if (!memberId || memberId.length > 100 || !code || code.length > 100) return NextResponse.json({ error: "Vul je lid-ID en persoonlijke code in." }, { status: 400, headers });
    const snapshot = await getSnapshot();
    const member = snapshot && await findMember(memberId, code, snapshot);
    if (!member || !snapshot) return NextResponse.json({ error: "Lid-ID of code klopt niet." }, { status: 401, headers });
    const token = await createSession(member, snapshot);
    await setSessionCookie(token);
    await clearAttempts(request, "login");
    return NextResponse.json({ ok: true }, { headers });
  } catch {
    return NextResponse.json({ error: "Inloggen lukt nu niet. Probeer later opnieuw." }, { status: 503, headers });
  }
}
