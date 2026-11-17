import { requireAdmin } from "@/lib/portal/admin/access";
import { respond } from "@/lib/portal/admin/api";
import { view, working } from "@/lib/portal/admin/storage";
export const runtime = "nodejs";
export const preferredRegion = "fra1";
export async function GET(request: Request) {
  return respond(async () => { await requireAdmin(request); const { state, live } = await working(); return view(state, live.digest); });
}
