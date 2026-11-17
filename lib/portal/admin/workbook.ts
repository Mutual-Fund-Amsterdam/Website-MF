import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { readPackage, writePackage } from "../xlsx-results";
import { integrationGet, integrationSet, pepper } from "../store";
import { parseWorkbook } from "../workbook";
import { validateInputContinuity } from "../input-workbook";
import { newAdministration, projectAdministration, ensure } from "./engine";
import { seal, unseal } from "./crypto";
import { type Administration, AdminError } from "./model";
import { readRoster } from "./roster";
import { restoredAdministration, retainAccess } from "./backup";
import { view } from "./storage";

const escape = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
function column(n: number): string { return n < 26 ? String.fromCharCode(65 + n) : column(Math.floor(n / 26) - 1) + column(n % 26); }
function sheet(rows: unknown[][]) {
  return '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + rows.map((row, r) => '<row r="' + (r + 1) + '">' + row.map((value, c) => {
    const ref = column(c) + (r + 1);
    return typeof value === "number" && Number.isFinite(value) ? '<c r="' + ref + '"><v>' + value + '</v></c>' : '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + escape(value) + '</t></is></c>';
  }).join("") + "</row>").join("") + "</sheetData></worksheet>";
}
export async function exportWorkbook(state: Administration) {
  const data = view(state, state.baseDigest), id = randomBytes(24).toString("hex");
  const tabs: Record<string, unknown[][]> = {
    Leden: [["Lid-ID", "Naam", "Fonds", "Status", "Rol", "Deelbewijzen"], ...data.members.map(m => [m.id, m.name, m.fund, m.active ? "Actief" : "Inactief", m.role, m.participation == null || data.units?.[m.fund] == null ? null : m.participation * data.units[m.fund]])],
    Aandelen: [["Ticker", "Naam", "Fonds", "Aantal", "Valuta", "Beurs"], ...data.positions.map(p => [p.ticker, p.name, p.fund, p.quantity, p.currency, p.exchange])],
    Cash: [["Fonds", "ING EUR", "Datum ING", "Saxo EUR", "Saxo USD", "Saxo CAD", "Datum Saxo"], ...data.cash.map(c => [c.fund, c.ingEur, c.ingAsOf, c.brokerEur, c.brokerUsd, c.brokerCad, c.brokerAsOf])],
    Valutacash: [["Fonds", "Valuta", "Bedrag", "Datum"], ...data.cash.flatMap(c => Object.entries(c.extraBalances || {}).map(([cur, v]) => [c.fund, cur, v.amount, v.date]))],
    Catalogus: [["Ticker", "Naam", "Beurs", "Valuta", "Sector"], ...data.catalog.map(a => [a.ticker, a.name, a.exchange, a.currency, a.sector])],
    Transacties: [["Datum", "Fonds", "Aandeel", "Handeling", "Aantal"], ...data.trades.map(t => [t.date, t.fund, t.symbol, t.kind === "Buy" ? "Koop" : "Verkoop", t.quantity])],
    Ledenboekingen: [["Datum", "Fonds", "Lid-ID", "Bedrag EUR", "Boekingsprijs", "Deelbewijzen"], ...data.transactions.map(t => [t.date, t.fund, t.memberId, t.amount, t.nav, t.units])],
    Ledenhistorie: [["Naam", "Fonds", "Periode", "Bron"], ...data.archive.map(r => [r.name, r.fund, r.period, r.source])],
    Bestuursinvoer: [["Tijdstip", "Bestuurder", "Handeling"], ...[...data.audit, ...data.bookings].map(b => [b.at, b.actor, b.label])],
    Import: [["Mutual Fund bestuursadministratie", "MF-BESTUUR-1"], ["Uitvoer", id], ["Werkstand", state.revision], ["Gebruik", "Importeer deze export via Invoer in de bestuursadministratie. Wijzigingen voer je in de applicatie in."]],
  };
  const names = Object.keys(tabs), parts = new Map<string, Buffer>();
  parts.set("[Content_Types].xml", Buffer.from('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + names.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join("") + "</Types>"));
  parts.set("_rels/.rels", Buffer.from('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'));
  parts.set("xl/workbook.xml", Buffer.from('<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + names.map((n, i) => '<sheet name="' + escape(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join("") + "</sheets></workbook>"));
  parts.set("xl/_rels/workbook.xml.rels", Buffer.from('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + names.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join("") + "</Relationships>"));
  names.forEach((n, i) => parts.set("xl/worksheets/sheet" + (i + 1) + ".xml", Buffer.from(sheet(tabs[n]))));
  parts.set("mutual-fund-export.txt", Buffer.from(id));
  const bytes = writePackage(parts);
  ensure(bytes.length <= 2_000_000, "De export overschrijdt de importlimiet van 2 MB.");
  // Credentials stay inside encrypted server storage. The downloadable workbook contains a reference only.
  const encrypted = seal({ state, fileHash: createHash("sha256").update(bytes).digest("hex") }, "export:" + id);
  const chunks = encrypted.match(/.{1,48000}/g)!;
  await Promise.all(chunks.map((c, i) => integrationSet("admin-export:" + id + ":" + i, c)));
  await integrationSet("admin-export:" + id, chunks.length);
  return bytes;
}
export async function readAdministrationWorkbook(bytes: Buffer, current: Administration) {
  const parts = readPackage(bytes), reference = parts.get("mutual-fund-export.txt")?.toString();
  if (reference) {
    ensure(/^[a-f0-9]{48}$/.test(reference), "Ongeldige exportverwijzing.");
    const count = await integrationGet<number>("admin-export:" + reference);
    ensure(count && count > 0 && count <= 300, "Deze export hoort niet bij deze bestuursomgeving of de bewaarde export ontbreekt.");
    const chunks = await Promise.all(Array.from({ length: count }, (_, i) => integrationGet<string>("admin-export:" + reference + ":" + i)));
    ensure(chunks.every(Boolean), "De bewaarde export is onvolledig.");
    const saved = unseal<{ state: Administration; fileHash: string }>(chunks.join(""), "export:" + reference);
    ensure(saved.fileHash === createHash("sha256").update(bytes).digest("hex"), "Deze export is buiten de applicatie gewijzigd. Voer de wijziging via Invoer in.");
    return restoredAdministration(saved.state, current);
  }
  const roster = await readRoster(bytes, current);
  if (roster) return roster;
  const snapshot = await parseWorkbook(bytes, pepper(), projectAdministration(current));
  const existing = projectAdministration(current);
  validateInputContinuity(snapshot, existing);
  retainAccess(snapshot, existing);
  return { ...newAdministration(snapshot), baseDigest: current.baseDigest, revision: randomBytes(32).toString("hex"), archive: current.archive, audit: [...current.audit, ...current.bookings.map(({ id, actor, at, label }) => ({ id, actor, at, label }))] };
}
