import { NextResponse } from "next/server";
import { configured, getSnapshot } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function GET() {
  if (!configured()) return NextResponse.json({ ready: false }, { headers: { "Cache-Control": "no-store" } });
  try {
    return NextResponse.json({ ready: Boolean(await getSnapshot()) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ready: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
