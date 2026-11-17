import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal/admin/access";
import { privateHeaders, respond } from "@/lib/portal/admin/api";
import { working } from "@/lib/portal/admin/storage";
import { exportBackup } from "@/lib/portal/admin/backup";
export const runtime = "nodejs";
export const preferredRegion = "fra1";
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { state } = await working();
    return new NextResponse(new Uint8Array(exportBackup(state)), { headers: { ...privateHeaders, "Content-Type": "application/octet-stream", "Content-Disposition": 'attachment; filename="Mutual-Fund.mfbackup"' } });
  } catch (error) { return respond(async () => { throw error; }); }
}
