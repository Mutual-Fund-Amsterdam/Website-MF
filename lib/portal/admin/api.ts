import { NextResponse } from "next/server";
import { AdminError } from "./model";

export const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" };
export async function jsonBody(request: Request) {
  if (Number(request.headers.get("content-length")) > 20000) throw new AdminError("De aanvraag is te groot.", 413);
  const text = await request.text();
  if (text.length > 20000) throw new AdminError("De aanvraag is te groot.", 413);
  let value; try { value = JSON.parse(text); } catch { throw new AdminError("Ongeldige invoer."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AdminError("Ongeldige invoer.");
  return value as Record<string, unknown>;
}
export function strings(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AdminError("Ongeldige invoer.");
  const entries = Object.entries(value);
  if (entries.some(([k, v]) => k.length > 50 || typeof v !== "string" || v.length > 300)) throw new AdminError("Ongeldig invoerveld.");
  return Object.fromEntries(entries) as Record<string, string>;
}
export async function respond(action: () => Promise<unknown>) {
  try { return NextResponse.json(await action(), { headers: privateHeaders }); }
  catch (error) {
    const known = error instanceof AdminError;
    return NextResponse.json({ error: known ? error.message : "De wijziging kon niet worden verwerkt. Controleer je invoer en probeer opnieuw." }, { status: known ? error.status : 400, headers: privateHeaders });
  }
}
