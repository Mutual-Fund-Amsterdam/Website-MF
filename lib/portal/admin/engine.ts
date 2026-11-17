import { createHash, randomBytes } from "node:crypto";
import { applyInputWorkbook, type InputCell, type InputSheet } from "../input-workbook";
import { codeDigest } from "../workbook";
import { INPUT_CURRENCIES } from "../split-workbook";
import type { Member, Snapshot, FundNumber } from "../types";
import { replayCash, type CashEntry } from "./cash";
import { normalizeInput } from "./fields";
import { AdminError, labels, today, type Administration, type Booking, type BookingInput, type Instrument } from "./model";

export const venues: Record<string, [string, string]> = {
  "Euronext Amsterdam": ["XAMS", "EURONEXT"], "Euronext Paris": ["XPAR", "EURONEXT"],
  Nasdaq: ["XNAS", "NASDAQ"], "New York Stock Exchange": ["XNYS", "NYSE"],
  "NYSE American": ["XASE", "AMEX"], "Toronto Stock Exchange": ["XTSE", "TSX"],
  "Vienna Stock Exchange": ["XWBO", "VIE"],
};
export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new AdminError(message);
}
export function number(value: string | undefined, title: string, zero = false, signed = false) {
  let text = (value ?? "").trim().replace(/\s/g, "");
  if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(text)) text = text.replaceAll(".", "");
  const n = Number(text.replace(",", "."));
  ensure(text && /^-?\d+(?:[.,]\d+)?$/.test(text) && Number.isFinite(n) && Math.abs(n) < 1e12 && (signed || n > 0 || zero && n === 0), "Vul een geldig " + title + " in.");
  return n;
}
function validDate(value: string) {
  ensure(/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value <= today(), "Kies een geldige datum tot en met vandaag.");
}
export function newAdministration(snapshot: Snapshot): Administration {
  const instruments = new Map<string, Instrument>();
  for (const { fund, quantity, ...instrument } of snapshot.positions) {
    const old = instruments.get(instrument.ticker);
    ensure(!old || old.exchange === instrument.exchange && old.currency === instrument.currency, "Dezelfde ticker heeft meerdere noteringen. Controleer eerst de bron.");
    instruments.set(instrument.ticker, instrument);
  }
  return { schema: 1, revision: snapshot.digest, baseDigest: snapshot.digest, base: structuredClone(snapshot), bookings: [], audit: [], catalog: [...instruments.values()], archive: [], updatedAt: null };
}
function instrument(input: BookingInput): Instrument {
  const ticker = input.ticker?.trim().toUpperCase(), name = input.name?.trim(), exchange = input.exchange, currency = input.currency;
  ensure(ticker && /^[A-Z0-9.^_-]{1,24}$/.test(ticker) && name && name.length <= 160 && venues[exchange] && INPUT_CURRENCIES.includes(currency) && input.sector?.trim(), "Vul ticker, naam, beurs, valuta en sector in.");
  return { ticker, name, exchange, currency, isin: "", marketSymbol: ticker + "." + venues[exchange][0], tradingViewSymbol: venues[exchange][1] + ":" + ticker, sector: input.sector.trim() };
}
type Row = Record<string, InputCell>;
function inputSheet(sections: Record<string, Row[]>, cutoff: string): InputSheet[] {
  const data: InputCell[][] = [["Versie", "MF-INVOER-2"], [], ["Basisdatum", cutoff]];
  for (const section of ["LEDEN", "AANDELEN", "LEDENMUTATIES", "SALDI"]) {
    const rows = sections[section], headers = [...new Set(["Invoer-ID", "Verwerking", ...rows.flatMap(Object.keys)])];
    data.push(["#" + section], headers, ...rows.map(r => headers.map(h => r[h] ?? null)));
  }
  return [{ sheet: "Invoer", data }];
}
export function projectAdministration(state: Administration): Snapshot {
  const snapshot = structuredClone(state.base);
  if (!state.bookings.length) return snapshot;
  const members = new Map(snapshot.members.map(m => [m.id, m]));
  const catalog = new Map(state.catalog.map(p => [p.ticker, p]));
  const sections: Record<string, Row[]> = { LEDEN: [], AANDELEN: [], LEDENMUTATIES: [], SALDI: [] };
  const start = snapshot.requestedDate || snapshot.unitLedger?.asOf[1] || today();
  const cutoff = new Date(Date.parse(start) - 86400000).toISOString().slice(0, 10);
  const cashEntries: CashEntry[] = [];
  for (const booking of state.bookings) {
    const d = booking.input, f = +d.fund as FundNumber;
    if (booking.member) members.set(booking.member.id, structuredClone(booking.member));
    if (booking.destination) members.set(booking.destination.id, structuredClone(booking.destination));
    if (booking.loginDigest) { const m = members.get(d.member); ensure(m, "Lid ontbreekt."); m.loginDigest = booking.loginDigest; }
    if (d.type === "close" || d.type === "exit") { const m = members.get(d.member); ensure(m, "Lid ontbreekt."); m.active = false; }
    if (d.type === "stock" || d.type === "trade" && d.newStock === "1") { const a = instrument(d); catalog.set(a.ticker, a); }
    const base = { "Invoer-ID": booking.id, Verwerking: "Klaar", Datum: d.date, Fonds: f };
    if (d.type === "trade") {
      const a = catalog.get(d.ticker.toUpperCase()); ensure(a, "Voeg het aandeel toe.");
      const qty = number(d.quantity, "aantal"), price = number(d.price, "prijs"), fee = number(d.fee || "0", "kosten", true);
      const buy = d.side === "Koop"; ensure(buy || d.side === "Verkoop", "Kies Koop of Verkoop.");
      const currency = d.settlementCurrency || a.currency;
      const rate = currency === a.currency ? 1 : number(d.rate, "wisselkoers");
      ensure(INPUT_CURRENCIES.includes(currency), "Kies een geldige afrekenvaluta.");
      cashEntries.push({ fund: f, bank: "Saxo", currency, date: d.date, amount: ((buy ? -1 : 1) * qty * price - fee) / rate, absolute: false });
      sections.AANDELEN.push({ ...base, Handeling: d.side, Ticker: a.ticker, Aandeel: a.name, Aantal: qty, Prijs: price, Kosten: fee, Broker: "Saxo", Valuta: a.currency, Beurs: a.exchange, ISIN: a.isin || "-", Koerscode: a.marketSymbol!, "TradingView-code": a.tradingViewSymbol, Sector: a.sector!, Cashvaluta: currency, Cashbedrag: ((buy ? -1 : 1) * qty * price - fee) / rate });
    }
    if (["join", "deposit", "withdraw", "exit", "switch"].includes(d.type) && d.amount) {
      const amount = number(d.amount, "bedrag");
      cashEntries.push({ fund: f, bank: "ING", currency: "EUR", date: d.date, amount: ["join", "deposit"].includes(d.type) ? amount : -amount, absolute: false });
      if (d.type === "switch") cashEntries.push({ fund: +d.targetFund as FundNumber, bank: "ING", currency: "EUR", date: d.date, amount, absolute: false });
      sections.LEDENMUTATIES.push({ ...base, "Lid-ID": booking.member?.id || d.member, Handeling: ({ join: "Storting", deposit: "Storting", withdraw: "Opname", exit: "Uitstap", switch: "Fondswissel" })[d.type]!, "Bedrag EUR": number(d.amount, "bedrag"), Boekingsprijs: number(d.nav, "boekingsprijs"), "Naar fonds": d.targetFund ? +d.targetFund : null, "Naar lid-ID": d.targetMember || null, "Boekingsprijs nieuw fonds": d.targetNav ? number(d.targetNav, "boekingsprijs doelfonds") : null });
    }
    if (d.type === "cash") {
      ensure(["ING", "Saxo"].includes(d.bank) && INPUT_CURRENCIES.includes(d.currency) && (d.bank !== "ING" || d.currency === "EUR"), "Kies ING in EUR of een Saxo-rekening.");
      const amount = number(d.amount, "saldo", true, true);
      ensure(Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-6, "Een cashstand heeft maximaal twee decimalen.");
      cashEntries.push({ fund: f, bank: d.bank as "ING" | "Saxo", currency: d.currency, date: d.date, amount, absolute: true });
      sections.SALDI.push({ ...base, Rekening: d.bank === "Saxo" ? "Broker" : "ING", Valuta: d.currency, Saldo: amount });
    }
    if (d.type === "history") {
      ensure(snapshot.ledger && ["Saxo", "IBKR"].includes(d.broker) && ["Koop", "Verkoop"].includes(d.side), "Kies een broker en handeling.");
      const quantity = number(d.quantity, "aantal"), symbol = d.ticker.trim().toUpperCase();
      ensure(INPUT_CURRENCIES.includes(d.currency) && /^[A-Z0-9.^_-]{1,24}$/.test(symbol), "Vul ticker en valuta in.");
      ensure(!snapshot.ledger.broker.some(e => e.fund === f && e.date === d.date && e.symbol === symbol && e.kind === (d.side === "Koop" ? "Buy" : "Sell") && Math.abs(e.quantity ?? 0) === quantity && e.broker === d.broker), "Deze transactie staat al in de historie.");
      const hash = createHash("sha256").update(booking.id).digest("hex");
      snapshot.ledger.broker.push({ id: hash + ":1", sourceHash: hash, sourceRow: 1, fund: f, date: d.date, symbol, broker: d.broker, kind: d.side === "Koop" ? "Buy" : "Sell", quantity: quantity * (d.side === "Koop" ? 1 : -1), price: d.price ? number(d.price, "prijs") : null, currency: d.currency, description: "Historische registratie", assetClass: "stock", exchange: catalog.get(symbol)?.exchange || "", status: "Goedgekeurd", processing: "Negeren", source: "Bestuursadministratie", grossEur: null, commissionEur: null, netEur: null, nativeCash: null });
    }
    if (d.type === "quote") {
      const a = catalog.get(d.ticker); ensure(a, "Kies een aandeel.");
      const close = number(d.price, "slotkoers");
      const old = snapshot.manualPrices?.find(q => q.symbol === a.ticker && q.exchange === a.exchange && q.date === d.date);
      ensure(!old || old.close === close, "Er staat al een andere slotkoers op deze datum.");
      if (!old) (snapshot.manualPrices ??= []).push({ symbol: a.ticker, exchange: a.exchange, currency: a.currency, date: d.date, close, source: "Bestuursinvoer" });
    }
  }
  const latestCash = new Map<string, Row>();
  for (const row of sections.SALDI) latestCash.set([row.Fonds, row.Rekening, row.Valuta, row.Datum].join("|"), row);
  sections.SALDI = [...latestCash.values()];
  sections.LEDEN = [...members.values()].map(m => ({ "Invoer-ID": "lid-" + m.key, Verwerking: "Klaar", "Lid-ID": m.id, Naam: m.name, Fonds: m.fund, Rol: m.role, "Persoonlijke code": "behouden", "Toegang fondsen": m.allowedFunds.join(","), Status: m.active ? "Actief" : "Inactief" }));
  // The existing input engine owns member-unit replay, FX cash movements and overdraft checks.
  try { applyInputWorkbook(snapshot, inputSheet(sections, cutoff), id => members.get(id)!.loginDigest); }
  catch (error) { throw new AdminError(error instanceof Error ? error.message : "Controleer de boeking."); }
  snapshot.cash = replayCash(state.base.cash, cashEntries);
  snapshot.input = state.base.input ? { ...state.base.input, events: { ...state.base.input.events, ...snapshot.input?.events } } : snapshot.input;
  snapshot.digest = createHash("sha256").update(JSON.stringify({ base: state.base.digest, bookings: state.bookings })).digest("hex");
  snapshot.requestedDate = [start, ...state.bookings.filter(b => ["trade", "cash", "deposit", "withdraw", "exit", "switch", "quote"].includes(b.input.type) || b.input.type === "join" && b.input.amount).map(b => b.input.date)].sort().at(-1)!;
  snapshot.importedAt = state.updatedAt || state.base.importedAt;
  return snapshot;
}
function newMember(snapshot: Snapshot, fund: FundNumber, name: string, secret: string) {
  ensure(name.trim() && name.length <= 160 && !snapshot.members.some(m => m.fund === fund && m.name.trim().toLowerCase() === name.trim().toLowerCase()), "Controleer de naam. Dit lid bestaat mogelijk al in het fonds.");
  const ids = snapshot.members.filter(m => m.fund === fund).map(m => Number(m.id.match(/-(\d+)$/)?.[1]) || 0);
  const id = "F" + fund + "-" + String(Math.max(0, ...ids) + 1).padStart(3, "0"), code = randomBytes(18).toString("base64url");
  const member: Member = { id, key: fund + ":" + id, fund, name: name.trim(), role: "Lid", allowedFunds: [fund], active: true, loginDigest: codeDigest(id, code, secret), participation: 0, firstEntry: null, lastTransaction: null, sourceValue: null, deposits: 0, withdrawals: 0 };
  return { member, code };
}
export function book(state: Administration, input: BookingInput, id: string, actor: string, secret: string) {
  ensure(/^[a-f0-9-]{36}$/.test(id) && labels[input.type], "Ongeldige boeking.");
  validDate(input.date);
  const d = normalizeInput(input), fund = +d.fund as FundNumber;
  ensure([1, 2, 3].includes(fund), "Kies een fonds.");
  const snapshot = projectAdministration(state), start = state.base.requestedDate || state.base.unitLedger?.asOf[fund] || today();
  ensure(d.type === "history" || d.date >= start, "Deze boeking ligt vóór de beginstand. Gebruik historische registratie voor een reeds verwerkte transactie.");
  const booking: Booking = { id, input: { ...d }, actor, at: new Date().toISOString(), label: labels[d.type] + " · Fonds " + fund };
  booking.input = d;
  const credentials: { id: string; code: string }[] = [];
  if (d.type === "stock" || d.type === "trade" && d.newStock === "1") {
    const a = instrument(d);
    ensure(!state.catalog.some(x => x.ticker === a.ticker) && !state.bookings.some(b => (b.input.type === "stock" || b.input.newStock === "1") && b.input.ticker.toUpperCase() === a.ticker), "Deze ticker bestaat al.");
    d.ticker = a.ticker;
  }
  if (d.type === "join") {
    const created = newMember(snapshot, fund, d.name || "", secret);
    booking.member = created.member; credentials.push({ id: created.member.id, code: created.code });
  }
  if (["close", "deposit", "withdraw", "exit", "switch", "code"].includes(d.type)) {
    const member = snapshot.members.find(m => m.id === d.member && m.fund === fund);
    ensure(member, "Kies een lid uit dit fonds.");
    const joined = state.bookings.find(b => b.member?.id === d.member || b.destination?.id === d.member);
    ensure(!joined || d.date >= joined.input.date, "De boeking ligt vóór de inschrijving van dit lid.");
    if (["close", "deposit", "code"].includes(d.type)) ensure(member.active, "Dit lid is inactief.");
    if (d.type === "exit") {
      ensure(member.participation !== null && snapshot.totalUnitsByFund?.[fund], "Deelbewijzen ontbreken.");
      d.amount = String(member.participation * snapshot.totalUnitsByFund[fund] * number(d.nav, "boekingsprijs"));
    }
    if (d.type === "switch") {
      const target = +d.targetFund as FundNumber; ensure([1, 2, 3].includes(target) && target !== fund, "Kies een ander doelfonds.");
      let destination = snapshot.members.find(m => m.fund === target && m.name.trim().toLowerCase() === member.name.trim().toLowerCase());
      if (!destination) { const created = newMember(snapshot, target, member.name, secret); booking.destination = destination = created.member; credentials.push({ id: destination.id, code: created.code }); }
      ensure(destination.active, "Het lid in het doelfonds is inactief."); d.targetMember = destination.id;
    }
    if (d.type === "code") {
      ensure(member.role === "Lid", "Hoofdbestuurscodes worden buiten de invoerroute beheerd.");
      const code = randomBytes(18).toString("base64url"); booking.loginDigest = codeDigest(member.id, code, secret); credentials.push({ id: member.id, code });
    }
  }
  if (["deposit", "withdraw", "exit", "switch"].includes(d.type)) number(d.amount, "bedrag");
  const next = { ...state, revision: randomBytes(32).toString("hex"), updatedAt: booking.at, bookings: [...state.bookings, booking] };
  const projected = projectAdministration(next);
  ensure(projected.members.some(m => m.active && m.role === "Hoofdbestuurder"), "Er moet een actieve hoofdbestuurder overblijven.");
  return { state: next, snapshot: projected, credentials };
}
export function catalogFor(state: Administration) {
  const catalog = new Map(state.catalog.map(a => [a.ticker, a]));
  for (const b of state.bookings) if (b.input.type === "stock" || b.input.newStock === "1") { const a = instrument(b.input); catalog.set(a.ticker, a); }
  return [...catalog.values()];
}
