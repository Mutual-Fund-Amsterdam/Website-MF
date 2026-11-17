import readExcelFile from "read-excel-file/node";
import { randomBytes } from "node:crypto";
import { catalogFor, ensure, newAdministration, projectAdministration } from "./engine";
import type { Administration, HistoryMember } from "./model";
export async function readRoster(bytes: Buffer, current: Administration): Promise<Administration | null> {
  const sheets = await readExcelFile(bytes), roster = sheets.find(s => s.sheet === "Ledenbestand");
  if (!roster || sheets.some(s => s.sheet === "Fondsindex" || s.sheet === "Posities")) return null;
  const snapshot = projectAdministration(current), archive: HistoryMember[] = [...current.archive];
  const norm = (v: unknown) => String(v || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const matched = new Set<string>();
  for (const row of roster.data.filter(r => /^F[123]-\d+$/.test(String(r[2])) && r[0])) {
    const id = String(row[2]), member = snapshot.members.find(m => m.id === id);
    ensure(member && !matched.has(id), "Lid-ID ontbreekt in de financiële stand of staat dubbel in het ledenbestand.");
    const name = String(row[0]).trim(); ensure(name.length <= 160, "Controleer de naam in het ledenbestand.");
    matched.add(id); member.name = name;
  }
  ensure(matched.size > 0, "Geen leden met een bestaand lid-ID gevonden.");
  for (const sheet of sheets.filter(s => /^(Inschrijvingen|Uitschrijvingen) \d{2}-\d{2}$/.test(s.sheet))) {
    const join = sheet.sheet.startsWith("Inschrijvingen"), suffix = sheet.sheet.match(/(\d{2})-(\d{2})$/)!;
    for (const row of sheet.data.filter(r => r[0] && norm(r[join ? 5 : 2]) === (join ? "ja" : "nee"))) {
      const name = String(row[0]).trim(), fund = Number(String(row[1]).match(/[123]/)?.[0]) || null;
      archive.push({ name, fund, period: `20${suffix[1]}–20${suffix[2]}`, source: "Ledenbestand MF · " + sheet.sheet });
      if (!join) {
        const matches = snapshot.members.filter(m => norm(m.name) === norm(name) && m.fund === fund);
        if (matches.length === 1) matches[0].active = false;
      }
    }
  }
  ensure(snapshot.members.some(m => m.active && m.role === "Hoofdbestuurder"), "Er moet een actieve hoofdbestuurder blijven.");
  // No omitted person, role, credential, unit balance or cash balance is removed or replaced.
  return { ...newAdministration(snapshot), baseDigest: current.baseDigest, revision: randomBytes(32).toString("hex"), catalog: catalogFor(current), archive: [...new Map(archive.map(r => [JSON.stringify(r), r])).values()], audit: [...current.audit, ...current.bookings.map(({ id, actor, at, label }) => ({ id, actor, at, label }))] };
}
