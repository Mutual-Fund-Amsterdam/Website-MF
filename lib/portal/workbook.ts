import { createHash, createHmac } from "node:crypto";
import readExcelFile from "read-excel-file/node";
import type { Cash, FundNumber, ImportSummary, Member, Position, Snapshot } from "./types";

type Cell = string | number | boolean | Date | null;
type Sheet = { sheet: string; data: Cell[][] };
type Headers = Map<string, number>;

function cellText(value: Cell | undefined): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function cellNumber(value: Cell | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(cellText(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function cellDate(value: Cell | undefined): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = cellText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const dutch = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(text);
  if (dutch) return `${dutch[3]}-${dutch[2].padStart(2, "0")}-${dutch[1].padStart(2, "0")}`;
  return null;
}

function table(sheet: Sheet, required: string): { headers: Headers; firstDataRow: number } {
  for (let index = 0; index < Math.min(sheet.data.length, 15); index++) {
    const headers: Headers = new Map();
    sheet.data[index].forEach((cell, column) => { const label = cellText(cell); if (label) headers.set(label, column); });
    if (headers.has(required)) return { headers, firstDataRow: index + 1 };
  }
  throw new Error(`Kolom “${required}” ontbreekt in tabblad “${sheet.sheet}”.`);
}

function value(row: Cell[], headers: Headers, name: string): Cell | undefined {
  const column = headers.get(name);
  return column === undefined ? null : row[column];
}

function fundNumber(input: Cell | undefined): FundNumber | null {
  const number = cellNumber(input);
  return number === 1 || number === 2 || number === 3 ? number : null;
}

function allowedFunds(raw: string, own: FundNumber): FundNumber[] {
  const funds = raw.split(/[;,]/).map((piece) => Number(piece.trim())).filter((number): number is FundNumber => number === 1 || number === 2 || number === 3);
  return [...new Set<FundNumber>([own, ...funds])].sort() as FundNumber[];
}

export function normalizeMemberId(id: string): string {
  return id.normalize("NFKC").trim().toLocaleLowerCase("nl-NL");
}

export function codeDigest(id: string, code: string, pepper: string): string {
  return createHmac("sha256", pepper).update(`${normalizeMemberId(id)}:\0${code.normalize("NFKC").trim()}`).digest("hex");
}

export function summarize(snapshot: Snapshot): ImportSummary {
  const members = { 1: 0, 2: 0, 3: 0 };
  const positions = { 1: 0, 2: 0, 3: 0 };
  const cashDates: Record<FundNumber, string | null> = { 1: null, 2: null, 3: null };
  const participationTotals = { 1: 0, 2: 0, 3: 0 };
  for (const member of snapshot.members) { members[member.fund]++; participationTotals[member.fund] += member.participation ?? 0; }
  for (const position of snapshot.positions) positions[position.fund]++;
  for (const item of snapshot.cash) cashDates[item.fund] = item.ingAsOf;
  return { members, positions, cashDates, participationTotals, warnings: snapshot.warnings };
}

export async function parseWorkbook(bytes: Buffer, pepper: string): Promise<Snapshot> {
  if (bytes.length > 2_000_000) throw new Error("Het Excelbestand is groter dan 2 MB.");
  const sheets = await readExcelFile(bytes) as Sheet[];
  const get = (...names: string[]) => sheets.find((item) => names.includes(item.sheet));
  const accessSheet = get("Leden & toegang", "Toegang");
  const participationSheet = get("Participaties (check)", "Participaties");
  const positionsSheet = get("Posities");
  const cashSheet = get("Cashsaldi");
  if (!accessSheet || !participationSheet || !positionsSheet || !cashSheet) throw new Error("Een vereist tabblad ontbreekt: Leden & toegang, Participaties (check), Posities of Cashsaldi.");

  const { headers: accessHeaders, firstDataRow: accessStart } = table(accessSheet, "Naam");
  for (const column of ["Fonds", "Lid-ID", "Persoonlijke code", "Rol"]) {
    if (!accessHeaders.has(column)) throw new Error(`Kolom “${column}” ontbreekt bij Leden & toegang.`);
  }
  const warnings: string[] = [];
  if (!accessHeaders.has("Status")) warnings.push("Geen Status-kolom: alle geïmporteerde accounts krijgen voorlopig testtoegang.");
  const members: Member[] = [];
  const seenKeys = new Set<string>();
  const seenLogins = new Set<string>();
  for (let index = accessStart; index < accessSheet.data.length; index++) {
    const row = accessSheet.data[index];
    const name = cellText(value(row, accessHeaders, "Naam"));
    const fund = fundNumber(value(row, accessHeaders, "Fonds"));
    const id = cellText(value(row, accessHeaders, "Lid-ID"));
    if (!name && !fund && !id) continue;
    const code = cellText(value(row, accessHeaders, "Persoonlijke code"));
    if (!name || !fund || !id || !code) throw new Error(`Ongeldige ledenrij ${index + 1}: naam, fonds, lid-ID en code zijn verplicht.`);
    const key = `${fund}:${id}`;
    if (seenKeys.has(key)) throw new Error(`Dubbel lid-ID in fonds ${fund}, rij ${index + 1}.`);
    seenKeys.add(key);
    const loginDigest = codeDigest(id, code, pepper);
    if (seenLogins.has(loginDigest)) throw new Error(`De combinatie van lid-ID en code komt meerdere keren voor (rij ${index + 1}).`);
    seenLogins.add(loginDigest);
    const status = cellText(value(row, accessHeaders, "Status")).toLowerCase();
    const active = !["inactief", "uitgeschreven", "vervallen", "geblokkeerd"].includes(status);
    members.push({ key, id, name, fund, role: cellText(value(row, accessHeaders, "Rol")) || "Lid", allowedFunds: allowedFunds(cellText(value(row, accessHeaders, "Toegang fondsen")), fund), active, loginDigest, participation: null, firstEntry: null, lastTransaction: null, sourceValue: null, deposits: null, withdrawals: null });
  }
  if (!members.length) throw new Error("Er zijn geen leden gevonden.");

  const { headers: participationHeaders, firstDataRow: participationStart } = table(participationSheet, "Lid-ID");
  const memberMap = new Map(members.map((member) => [member.key, member]));
  for (let index = participationStart; index < participationSheet.data.length; index++) {
    const row = participationSheet.data[index];
    const id = cellText(value(row, participationHeaders, "Lid-ID"));
    const fund = fundNumber(value(row, participationHeaders, "Fonds"));
    if (!id || !fund) continue;
    const member = memberMap.get(`${fund}:${id}`);
    if (!member) continue;
    if (member.participation !== null) throw new Error(`Dubbele participatie voor fonds ${fund}, lid-ID ${id}.`);
    member.participation = cellNumber(value(row, participationHeaders, "Participatie"));
    member.sourceValue = cellNumber(value(row, participationHeaders, "Waarde op bronpeildatum"));
    member.firstEntry = cellDate(value(row, participationHeaders, "Eerste inlegdatum"));
    member.lastTransaction = cellDate(value(row, participationHeaders, "Laatste mutatie"));
    member.deposits = cellNumber(value(row, participationHeaders, "Totale inleg"));
    member.withdrawals = cellNumber(value(row, participationHeaders, "Totale opname"));
  }
  if (members.some((member) => member.participation === null)) throw new Error("Niet ieder lid heeft een bijpassende rij in Participaties (check).");

  const { headers: positionHeaders, firstDataRow: positionStart } = table(positionsSheet, "Ticker");
  const positions: Position[] = [];
  for (let index = positionStart; index < positionsSheet.data.length; index++) {
    const row = positionsSheet.data[index];
    const ticker = cellText(value(row, positionHeaders, "Ticker"));
    const fund = fundNumber(value(row, positionHeaders, "Fonds"));
    if (!ticker && !fund) continue;
    if (!ticker || !fund) throw new Error(`Ongeldige positie op rij ${index + 1}.`);
    const quantity = cellNumber(value(row, positionHeaders, "Aantal"));
    if (quantity === null || quantity < 0) throw new Error(`Aantal ontbreekt of is negatief bij ${ticker}, rij ${index + 1}.`);
    if (quantity === 0) continue;
    positions.push({ fund, ticker, quantity, name: cellText(value(row, positionHeaders, "Aandeel")) || ticker, currency: cellText(value(row, positionHeaders, "Valuta")).toUpperCase(), exchange: cellText(value(row, positionHeaders, "Beurs")), isin: cellText(value(row, positionHeaders, "ISIN")), tradingViewSymbol: cellText(value(row, positionHeaders, "TradingView-code")), marketSymbol: cellText(value(row, positionHeaders, "Koerscode")) || undefined, sector: cellText(value(row, positionHeaders, "Sector")) || undefined });
  }

  const { headers: cashHeaders, firstDataRow: cashStart } = table(cashSheet, "Fonds");
  const cash: Cash[] = [];
  for (let index = cashStart; index < cashSheet.data.length; index++) {
    const row = cashSheet.data[index];
    const fund = fundNumber(value(row, cashHeaders, "Fonds"));
    if (!fund) continue;
    if (cash.some((item) => item.fund === fund)) throw new Error(`Dubbele cashrij voor fonds ${fund}.`);
    cash.push({ fund, ingEur: cellNumber(value(row, cashHeaders, "ING-saldo EUR")), ingAsOf: cellDate(value(row, cashHeaders, "ING-peildatum")), brokerEur: cellNumber(value(row, cashHeaders, "Broker EUR")), brokerUsd: cellNumber(value(row, cashHeaders, "Broker USD")), brokerCad: cellNumber(value(row, cashHeaders, "Broker CAD")), brokerAsOf: cellDate(value(row, cashHeaders, "Broker-peildatum")), otherEur: cellNumber(value(row, cashHeaders, "Overige waarde EUR (zoals obligaties")), otherAsOf: cellDate(value(row, cashHeaders, "Peildatum overige waarde")) });
  }
  if (cash.length !== 3) throw new Error("Cashsaldi moet precies één rij voor elk van de drie fondsen bevatten.");
  for (const item of cash) {
    if (item.ingEur === null || !item.ingAsOf) warnings.push(`ING-saldo of peildatum ontbreekt voor fonds ${item.fund}.`);
    if (!item.brokerAsOf) warnings.push(`Broker-peildatum ontbreekt voor fonds ${item.fund}.`);
  }

  const overview = get("Overzicht");
  const snapshot: Snapshot = { schema: 1, digest: createHash("sha256").update(bytes).digest("hex"), importedAt: new Date().toISOString(), requestedDate: cellDate(overview?.data[4]?.[1]), members, positions, cash, warnings };
  const totals = summarize(snapshot).participationTotals;
  for (const fund of [1, 2, 3] as const) {
    if (Math.abs(totals[fund] - 1) > 0.005) warnings.push(`Participaties van fonds ${fund} tellen op tot ${(totals[fund] * 100).toFixed(2)}% in plaats van 100%; persoonlijke eurobedragen blijven verborgen.`);
  }
  if (members.some((member) => (member.sourceValue ?? 0) < 0)) warnings.push("Er zijn negatieve ledenwaarden in de bronadministratie; controleer deze vóór publicatie.");
  return snapshot;
}
