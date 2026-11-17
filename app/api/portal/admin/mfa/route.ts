import { mfaAction, mfaStatus, requireIdentity } from "@/lib/portal/admin/access";
import { jsonBody, respond, strings } from "@/lib/portal/admin/api";
export const runtime = "nodejs";
export const preferredRegion = "fra1";
export async function GET(request: Request) { return respond(async () => mfaStatus(await requireIdentity(request))); }
export async function POST(request: Request) { return respond(async () => mfaAction(request, strings(await jsonBody(request)))); }
