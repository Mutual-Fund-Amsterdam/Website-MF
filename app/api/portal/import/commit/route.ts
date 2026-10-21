import { NextResponse } from "next/server";
import { allowAttempt, configured, getMemberSession, publishPending, sameOrigin } from "@/lib/portal/store";

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
    const body = await request.json();
    const snapshot = await publishPending(String(body.id ?? ""));
    if (!snapshot) return NextResponse.json({ error: "De voorvertoning is verlopen. Upload opnieuw." }, { status: 410, headers });
    return NextResponse.json({ ok: true, importedAt: snapshot.importedAt }, { headers });
  } catch {
    return NextResponse.json({ error: "Publiceren lukt nu niet. Probeer opnieuw." }, { status: 503, headers });
  }
}
