import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/portal/admin/access";
import { respond } from "@/lib/portal/admin/api";
import { saveWorking, view, withWriter, working } from "@/lib/portal/admin/storage";
import { readAdministrationWorkbook } from "@/lib/portal/admin/workbook";
import { newAdministration, catalogFor } from "@/lib/portal/admin/engine";
import { importBackup } from "@/lib/portal/admin/backup";
import { AdminError } from "@/lib/portal/admin/model";
import { saveTemporary, readTemporary } from "@/lib/portal/admin/temporary";
import type { Administration } from "@/lib/portal/admin/model";
export const runtime = "nodejs";
export const preferredRegion = "fra1";
export async function POST(request: Request) {
  return respond(async () => {
    const { member } = await requireAdmin(request);
    if (Number(request.headers.get("content-length")) > 2_100_000) throw new AdminError("Het bestand is te groot.", 413);
    const form = await request.formData(), expected = String(form.get("revision"));
    return withWriter(async () => {
      const { state, live, header } = await working();
      if (state.revision !== expected) throw new AdminError("De stand is gewijzigd. Controleer opnieuw.", 409);
      const token = form.get("confirm");
      if (token) {
        if (!/^[a-f0-9]{48}$/.test(String(token))) throw new AdminError("Ongeldige importcontrole.");
        const pending = await readTemporary<{ state: Administration; actor: string; expected: string }>(String(token));
        if (pending.actor !== member.key || pending.expected !== state.revision || pending.state.baseDigest !== live.digest) throw new AdminError("Controleer de import opnieuw.", 409);
        const next = pending.state;
        next.bookings.push({ id: crypto.randomUUID(), input: { type: "import", date: new Date().toISOString().slice(0, 10), fund: "1" }, actor: member.key, at: new Date().toISOString(), label: "Gecontroleerde bronimport" });
        next.updatedAt = new Date().toISOString();
        await saveWorking(next, header);
        return { view: view(next, live.digest) };
      }
      const file = form.get("file"), publishedSource = form.get("source") === "published";
      let next: Administration;
      if (publishedSource) {
        next = { ...newAdministration(live), revision: randomBytes(32).toString("hex"), catalog: [...new Map([...catalogFor(state), ...newAdministration(live).catalog].map(a => [a.ticker, a])).values()], archive: state.archive,
          audit: [...state.audit, ...state.bookings.map(({ id, actor, at, label }) => ({ id, actor, at, label: "Werkstand vervangen: " + label }))] };
      } else {
        if (state.baseDigest !== live.digest) throw new AdminError("Lees eerst de nieuwste gepubliceerde stand in via Invoer.", 409);
        if (!(file instanceof File) || file.size > 2_000_000) throw new AdminError("Kies een bestand van maximaal 2 MB.");
        if (file.name.endsWith(".json")) {
          const archive = JSON.parse(await file.text());
          if (archive.format !== 1 || !Array.isArray(archive.rows) || archive.rows.length > 10000 || archive.rows.some((r: Record<string, unknown>) => typeof r.name !== "string" || r.name.length > 160 || ![null, 1, 2, 3].includes(r.fund as number | null) || typeof r.period !== "string" || r.period.length > 100 || typeof r.source !== "string" || r.source.length > 200)) throw new AdminError("Ongeldig ledenarchief.");
          next = { ...state, revision: randomBytes(32).toString("hex"), archive: [...archive.rows.map(({ name, fund, period, source }: Record<string, unknown>) => ({ name, fund, period, source })), ...state.archive.filter(r => r.source.startsWith("Ledenbestand MF ·"))] };
        } else if (file.name.endsWith(".mfbackup")) next = importBackup(Buffer.from(await file.arrayBuffer()), state);
        else if (file.name.endsWith(".xlsx")) next = await readAdministrationWorkbook(Buffer.from(await file.arrayBuffer()), state);
        else throw new AdminError("Kies een .xlsx-export, .mfbackup of Ledenhistorie MF.json.");
      }
      const id = randomBytes(24).toString("hex"), result = view(next, live.digest);
      await saveTemporary(id, { state: next, actor: member.key, expected: state.revision });
      return { id, members: result.members.length, active: result.members.filter(m => m.active).length, positions: result.positions.length, cash: result.cash, archive: result.archive.length, replacedBookings: publishedSource ? state.bookings.length : 0 };
    });
  });
}
