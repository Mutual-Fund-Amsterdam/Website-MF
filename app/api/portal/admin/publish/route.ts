import { requireAdmin } from "@/lib/portal/admin/access";
import { jsonBody, respond } from "@/lib/portal/admin/api";
import { publishReviewed } from "@/lib/portal/admin/storage";
export const runtime = "nodejs";
export const preferredRegion = "fra1";
export const maxDuration = 300;
export async function POST(request: Request) {
  return respond(async () => { const { member } = await requireAdmin(request), body = await jsonBody(request); return publishReviewed(String(body.id), member.key); });
}
