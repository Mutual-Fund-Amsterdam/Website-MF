import { requireAdmin } from "@/lib/portal/admin/access";
import { privateHeaders, respond } from "@/lib/portal/admin/api";
import { working } from "@/lib/portal/admin/storage";
import { exportWorkbook } from "@/lib/portal/admin/workbook";
export const runtime = "nodejs";
export const preferredRegion = "fra1";
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { state } = await working(), bytes = await exportWorkbook(state);
    return new Response(new Uint8Array(bytes), { headers: { ...privateHeaders, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="Mutual-Fund-bestuursadministratie.xlsx"' } });
  } catch (e) { return respond(async () => { throw e; }); }
}
