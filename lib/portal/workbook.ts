import { createHash, createHmac } from "node:crypto";
import readExcelFile from "read-excel-file/node";
import { auditLedger, validateLedger } from "./ledger.ts";
import type { BankEvent, BrokerEvent, MemberCheck, ReconstructionLedger } from "./ledger";
import type { Cash, FundHistoryPoint, FundNumber, ImportSummary, Member, MemberTransaction, Position, RiskMetrics, Snapshot } from "./types";

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

function parseLedger(sheets: Sheet[]): ReconstructionLedger | undefined {
  const bankSheet=sheets.find(s=>s.sheet==="Bankmutaties"),brokerSheet=sheets.find(s=>s.sheet==="Brokertransacties");
  if(!bankSheet&&!brokerSheet)return undefined;
  if(!bankSheet||!brokerSheet)throw new Error("Bankmutaties en Brokertransacties moeten samen aanwezig zijn.");
  const read=(sheet:Sheet,callback:(r:Cell[],h:Headers)=>void)=>{const {headers,firstDataRow}=table(sheet,"Bron-ID");for(const row of sheet.data.slice(firstDataRow)){if(cellText(value(row,headers,"Bron-ID")))callback(row,headers);}};
  const bank:BankEvent[]=[],broker:BrokerEvent[]=[],members:MemberCheck[]=[];
  read(bankSheet,(row,h)=>{
    const fund=fundNumber(value(row,h,"Fonds")),date=cellDate(value(row,h,"Boekdatum")),amount=cellNumber(value(row,h,"Bedrag EUR"));
    if(!fund||!date||amount===null)throw new Error("Ongeldige bankmutatie: fonds, boekdatum en bedrag zijn verplicht.");
    if(Math.abs(amount*100-Math.round(amount*100))>1e-6)throw new Error("Bankbedrag heeft meer dan twee decimalen.");
    bank.push({id:cellText(value(row,h,"Bron-ID")),fund,date,valueDate:cellDate(value(row,h,"Valutadatum"))??date,amountCents:Math.round(amount*100),kind:cellText(value(row,h,"Categorie")),description:cellText(value(row,h,"Omschrijving")),counterparty:cellText(value(row,h,"Tegenrekening")),memberId:cellText(value(row,h,"Lid-ID")),matchId:cellText(value(row,h,"Tegenboeking-ID")),status:cellText(value(row,h,"Beoordeling")),source:cellText(value(row,h,"Bronbestand")),sourceHash:cellText(value(row,h,"Bronhash")),sourceRow:cellNumber(value(row,h,"Bronregel"))??-1});
  });
  read(brokerSheet,(row,h)=>{
    const fund=fundNumber(value(row,h,"Fonds")),date=cellDate(value(row,h,"Datum"));if(!fund||!date)throw new Error("Ongeldige brokerregel: fonds en datum zijn verplicht.");
    broker.push({id:cellText(value(row,h,"Bron-ID")),fund,date,broker:cellText(value(row,h,"Broker")),kind:cellText(value(row,h,"Type")),symbol:cellText(value(row,h,"Ticker")),description:cellText(value(row,h,"Omschrijving")),quantity:cellNumber(value(row,h,"Aantal")),price:cellNumber(value(row,h,"Prijs")),currency:cellText(value(row,h,"Valuta")),grossEur:cellNumber(value(row,h,"Bruto EUR")),commissionEur:cellNumber(value(row,h,"Kosten EUR")),netEur:cellNumber(value(row,h,"Netto EUR")),nativeCash:cellNumber(value(row,h,"Cash native")),assetClass:cellText(value(row,h,"Instrument")),exchange:cellText(value(row,h,"Beurs")),status:cellText(value(row,h,"Beoordeling")),source:cellText(value(row,h,"Bronbestand")),sourceHash:cellText(value(row,h,"Bronhash")),sourceRow:cellNumber(value(row,h,"Bronregel"))??-1,processing:cellText(value(row,h,"Verwerking")),newSymbol:cellText(value(row,h,"Nieuwe ticker")),factor:cellNumber(value(row,h,"Factor")),cashCurrency:cellText(value(row,h,"Cashvaluta")),cashDelta:cellNumber(value(row,h,"Cashmutatie")),settlementDate:cellDate(value(row,h,"Afwikkeldatum"))??undefined});
  });
  const overview=sheets.find(s=>s.sheet==="Overzicht");
  const headerRow=overview?.data.findIndex(r=>r.some(c=>cellText(c)==="Bronwaarde EUR"))??-1;
  if(overview&&headerRow>=0){
    const headers=new Map<string,number>();overview.data[headerRow].forEach((c,i)=>headers.set(cellText(c),i));
    for(const row of overview.data.slice(headerRow+1)){
      const id=cellText(value(row,headers,"Lid-ID")),fund=fundNumber(value(row,headers,"Fonds"));if(!id&&!fund)break;if(!id||!fund)continue;
      members.push({id,fund,sourceValue:cellNumber(value(row,headers,"Bronwaarde EUR")),sourceFirstEntry:cellDate(value(row,headers,"Instap bron")),sourceId:cellText(value(row,headers,"Bronlid-ID"))});
    }
  }
  const ledger={bank,broker,members};validateLedger(ledger);return ledger;
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
  const mutationsSheet = get("Mutaties");
  const fundIndexSheet = get("Fondsindex");
  const transactions: MemberTransaction[] = [];
  const fundHistory: FundHistoryPoint[] = [];
  let totalUnitsByFund: Record<FundNumber, number> | undefined;
  if (mutationsSheet && fundIndexSheet) {
    const { headers: mutationHeaders, firstDataRow: mutationStart } = table(mutationsSheet, "Deelbewijsprijs EUR");
    for (let index = mutationStart; index < mutationsSheet.data.length; index++) {
      const row = mutationsSheet.data[index];
      const fund = fundNumber(value(row, mutationHeaders, "Fonds"));
      const memberId = cellText(value(row, mutationHeaders, "Lid-ID"));
      if (!fund && !memberId) continue;
      const date = cellDate(value(row, mutationHeaders, "Datum"));
      const amount = cellNumber(value(row, mutationHeaders, "Bedrag EUR"));
      const nav = cellNumber(value(row, mutationHeaders, "Deelbewijsprijs EUR"));
      if (!fund || !memberId || !date || amount === null || !nav || nav <= 0) throw new Error(`Ongeldige ledenmutatie op rij ${index + 1}.`);
      if (!memberMap.has(`${fund}:${memberId}`)) throw new Error(`Lid-ID ${memberId} op mutatierij ${index + 1} staat niet bij Leden & toegang.`);
      transactions.push({ fund, memberId, date, amount, nav, units: amount / nav, source: cellText(value(row, mutationHeaders, "Bron")) });
    }
    const { headers: indexHeaders, firstDataRow: indexStart } = table(fundIndexSheet, "Waarde deelbewijs EUR");
    for (let index = indexStart; index < fundIndexSheet.data.length; index++) {
      const row = fundIndexSheet.data[index];
      const fund = fundNumber(value(row, indexHeaders, "Fonds"));
      const date = cellDate(value(row, indexHeaders, "Datum"));
      const nav = cellNumber(value(row, indexHeaders, "Waarde deelbewijs EUR"));
      const totalUnits = cellNumber(value(row, indexHeaders, "Totaal deelbewijzen"));
      if (fund && date && nav && nav > 0 && totalUnits && totalUnits > 0) fundHistory.push({ fund, date, nav, totalUnits });
    }
    const base: Record<FundNumber, number> = { 1: 0, 2: 0, 3: 0 };
    for (let row = 4; row <= 6; row++) {
      const fund = fundNumber(fundIndexSheet.data[row]?.[6]);
      const units = cellNumber(fundIndexSheet.data[row]?.[7]);
      if (fund && units && units > 0) base[fund] = units;
    }
    if (Object.values(base).some((units) => units <= 0)) throw new Error("Basisdeelbewijzen ontbreken in Fondsindex.");
    totalUnitsByFund = { ...base };
    for (const event of transactions) if (event.source.toLowerCase() === "nieuw") totalUnitsByFund[event.fund] += event.units;
    if (Object.values(totalUnitsByFund).some((units) => units <= 0)) throw new Error("Het aantal fondsdeelbewijzen is ongeldig.");
    for (const member of members) {
      const own = transactions.filter((event) => event.fund === member.fund && event.memberId === member.id).sort((a, b) => a.date.localeCompare(b.date));
      const units = own.reduce((sum, event) => sum + event.units, 0);
      if (units < -0.000001) throw new Error(`Lid ${member.id} heeft meer deelbewijzen opgenomen dan opgebouwd.`);
      member.participation = Math.max(0, units) / totalUnitsByFund[member.fund];
      member.firstEntry = own.find((event) => event.amount > 0)?.date ?? null;
      member.lastTransaction = own.at(-1)?.date ?? null;
      member.deposits = own.filter((event) => event.amount > 0).reduce((sum, event) => sum + event.amount, 0);
      member.withdrawals = -own.filter((event) => event.amount < 0).reduce((sum, event) => sum + event.amount, 0);
    }
  } else if (members.some((member) => member.participation === null)) {
    throw new Error("Niet ieder lid heeft een bijpassende rij in Participaties (check).");
  }

  const riskSheet = get("Risico");
  const risk: Partial<Record<FundNumber, RiskMetrics>> = {};
  if (riskSheet) for (let index = 4; index <= 6; index++) {
    const row = riskSheet.data[index];
    const fund = fundNumber(row?.[0]);
    if (fund) risk[fund] = { asOf: fundHistory.filter((point) => point.fund === fund).at(-1)?.date ?? null, volatility: cellNumber(row?.[1]), sharpe: cellNumber(row?.[2]), beta: cellNumber(row?.[3]), maxDrawdown: cellNumber(row?.[4]) };
  }

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
  const snapshot: Snapshot = { schema: 1, digest: createHash("sha256").update(bytes).digest("hex"), importedAt: new Date().toISOString(), requestedDate: cellDate(overview?.data[4]?.[1]), members, positions, cash, transactions, fundHistory, totalUnitsByFund, risk, warnings };
  snapshot.ledger=parseLedger(sheets);
  const ledgerAudit=auditLedger(snapshot);
  if(ledgerAudit){
    if(ledgerAudit.bank.some(c=>c.differenceCents!==0))throw new Error("ING-beginsaldo en mutaties sluiten niet aan op het eindsaldo.");
    warnings.push(`Broncontrole: ${ledgerAudit.bankRows} ING-mutaties, ${ledgerAudit.brokerRows} brokerregels en ${ledgerAudit.issues.length} controlepunten. Masterbedragen zijn niet automatisch vervangen.`);
    const memberFailures=ledgerAudit.issues.filter(i=>i.category==="Leden").length;
    if(memberFailures)warnings.push(`${memberFailures} leden wijken af van de oorspronkelijke administratie.`);
  }
  const totals = summarize(snapshot).participationTotals;
  for (const fund of [1, 2, 3] as const) {
    if (Math.abs(totals[fund] - 1) > 0.005) warnings.push(`Participaties van fonds ${fund} tellen op tot ${(totals[fund] * 100).toFixed(2)}% in plaats van 100%; controleer ontbrekende of uitgeschreven deelnemers.`);
  }
  if (members.some((member) => (member.sourceValue ?? 0) < 0)) warnings.push("Er zijn negatieve ledenwaarden in de bronadministratie; controleer deze vóór publicatie.");
  return snapshot;
}
