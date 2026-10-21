import { NextResponse } from "next/server";
import { allowAttempt, checkImportSecret, configured, getMemberSession, getSnapshot, publishPending, sameOrigin } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!sameOrigin(request)) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 403, headers });
  if (!configured()) return NextResponse.json({ error: "De ledenomgeving is nog niet ingericht." }, { status: 503, headers });
  try {
    if (!await allowAttempt(request, "import")) return NextResponse.json({ error: "Te veel pogingen. Probeer het later opnieuw." }, { status: 429, headers });
    const body = await request.json();
    if (!checkImportSecret(String(body.secret ?? ""))) return NextResponse.json({ error: "Beheersleutel klopt niet." }, { status: 401, headers });
    const existing = await getSnapshot();
    const session = await getMemberSession();
    if (existing && session?.member.role.toLowerCase() !== "hoofdbestuurder") {
      return NextResponse.json({ error: "Alleen het hoofdbestuur kan importeren." }, { status: 403, headers });
    }
    const snapshot = await publishPending(String(body.id ?? ""));
    if (!snapshot) return NextResponse.json({ error: "De voorvertoning is verlopen. Upload opnieuw." }, { status: 410, headers });
    return NextResponse.json({ ok: true, importedAt: snapshot.importedAt }, { headers });
  } catch {
    return NextResponse.json({ error: "Publiceren lukt nu niet. Probeer opnieuw." }, { status: 503, headers });
  }
}
