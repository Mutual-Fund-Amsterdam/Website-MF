import { requireAdmin } from "@/lib/portal/admin/access";
import { jsonBody, respond } from "@/lib/portal/admin/api";
import { preparePublication } from "@/lib/portal/admin/storage";
export const runtime = "nodejs";
export const preferredRegion = "fra1";
export async function POST(request: Request) {
  return respond(async () => { const { member } = await requireAdmin(request), body = await jsonBody(request); return preparePublication(String(body.revision), member.key); });
}
