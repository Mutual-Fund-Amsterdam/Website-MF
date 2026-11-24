import type { Snapshot } from "./types";

type Cell = string | number | null;
type Fact = { group: string; key: string; label: string; value: Cell };
export type Change = { label: string; before: Cell; after: Cell };
export type DifferenceGroup = { name: string; changes: Change[] };
export type ImportDifferences = { groups: DifferenceGroup[]; warnings: string[] };

function facts(s: Snapshot) {
  const rows = new Map<string, Fact>();
  function add(group: string, key: string, label: string, value: Cell) {
    rows.set(JSON.stringify([group, key]), { group, key, label, value });
  }
  // Sort grouped records before numbering: reordering workbook rows is not a financial change.
  function records(group: string, title: string, entries: [string, string][]) {
    let previous = "", occurrence = 0;
    for (const [label, value] of entries.sort(([a,x],[b,y]) => a.localeCompare(b) || x.localeCompare(y))) {
      occurrence = label === previous ? occurrence + 1 : 1;
      previous = label;
      add(group, title + "/" + label + "/" + occurrence, title + " · " + label, value);
    }
  }
  for (const fund of [1, 2, 3] as const) {
    const group = "Fonds " + fund;
    for (const m of s.members.filter(m => m.fund === fund)) {
      const fields = { Naam:m.name, Rol:m.role, Status:m.active ? "Actief" : "Inactief", Fondstoegang:m.allowedFunds.join(", "),
        "Participatie (%)":m.participation === null ? null : m.participation * 100, "Bronwaarde (€)":m.sourceValue,
        "Inleg (€)":m.deposits, "Opname (€)":m.withdrawals, "Eerste inleg":m.firstEntry, "Laatste mutatie":m.lastTransaction };
      for (const [field,value] of Object.entries(fields)) add(group, m.key + "/" + field, m.id + " · " + field, value);
    }
    const lots = new Map<string, number>();
    const positions = s.positions.filter(p => p.fund === fund).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    for (const p of positions) {
      const instrument = p.exchange + "/" + p.ticker;
      const occurrence = (lots.get(instrument) ?? 0) + 1;
      lots.set(instrument, occurrence);
      const id = instrument + "/" + occurrence;
      for (const [field, value] of Object.entries({Aantal:p.quantity, Naam:p.name, Valuta:p.currency, Sector:p.sector ?? null, ISIN:p.isin, Koerscode:p.marketSymbol ?? null, TradingView:p.tradingViewSymbol})) {
        add(group, "positie/" + id + "/" + field, p.ticker + " · " + p.exchange + " · " + field, value);
      }
    }
    const c = s.cash.find(c => c.fund === fund);
    if (c) {
      const balances = { "ING (€)":c.ingEur, "Broker (€)":c.brokerEur, "Broker (USD)":c.brokerUsd, "Broker (CAD)":c.brokerCad,
        "Overige waarde (€)":c.otherEur, "Uitbetalingsverplichting (€)":c.payablesEur, "Peildatum ING":c.ingAsOf,
        "Peildatum broker":c.brokerAsOf,"Peildatum overige waarde":c.otherAsOf, "Peildatum verplichtingen":c.payablesAsOf, "Cashbasis":c.basisNote };
      for (const [label,value] of Object.entries(balances)) add(group,"cash/" + label,label,value ?? null);
      for (const [currency,b] of Object.entries(c.extraBalances ?? {})) add(group,"cash-extra/" + currency,"Broker " + currency,b.amount + " · " + b.date);
    }
    add(group, "units", "Totaal deelbewijzen", s.totalUnitsByFund?.[fund] ?? null);
    add(group, "units-date", "Peildatum deelbewijzen", s.unitLedger?.asOf[fund] ?? null);
    records(group,"Fondsindex",(s.fundHistory ?? []).filter(p=>p.fund===fund).map(p=>[p.date,p.nav+" EUR × "+p.totalUnits]));
    records(group,"Gecontroleerde fondsstand",(s.valuationReferences ?? []).filter(p=>p.fund===fund).map(p=>[p.date,p.nav+" EUR × "+p.totalUnits+" · "+p.source]));
    records(group,"Ledenmutatie",(s.transactions ?? []).filter(p=>p.fund===fund).map(p=>[p.date+" · "+p.memberId,p.amount+" EUR · "+p.units+" deelbewijzen · NAV "+p.nav+" · "+p.source]));
    for (const [key,value] of Object.entries(s.risk?.[fund] ?? {})) add(group,"risk/"+key,"Risico · "+key,value);
  }
  records("Koershistorie","Slotkoers",(s.manualPrices ?? []).map(p=>[p.symbol+" · "+p.exchange+" · "+p.date,
    p.close+" "+p.currency+(p.adjustedClose !== undefined ? " · aangepast "+p.adjustedClose : "")+" · "+p.source]));
  return rows;
}

export function compareImports(previous: Snapshot | null, next: Snapshot): ImportDifferences {
  const current = previous ? facts(previous) : new Map<string, Fact>();
  const proposed = facts(next);
  const groups = new Map<string, Change[]>();
  let missingPrices = 0;
  function change(group: string, label: string, before: Cell, after: Cell) {
    const changes = groups.get(group) ?? [];
    changes.push({ label, before, after });
    groups.set(group, changes);
  }
  for (const key of new Set([...current.keys(), ...proposed.keys()])) {
    const a = current.get(key), b = proposed.get(key);
    if ((a?.value ?? null) === (b?.value ?? null)) continue;
    const row = (b ?? a)!;
    change(row.group, row.label, a?.value ?? null, b?.value ?? null);
    if (row.group === "Koershistorie" && !b) missingPrices++;
  }
  const oldMembers = new Map(previous?.members.map(m => [m.key,m]));
  for (const m of next.members) {
    const old = oldMembers.get(m.key);
    if (old && old.loginDigest !== m.loginDigest) change("Fonds "+m.fund, m.id+" · Persoonlijke code","Bestaande code","Gewijzigde code");
  }
  const fieldNames: Record<string,string> = {
    date:"Datum", valueDate:"Valutadatum", amountCents:"Bedrag (cent)", kind:"Type", description:"Omschrijving",
    counterparty:"Tegenrekening", memberId:"Lid", matchId:"Tegenboeking", status:"Beoordeling", source:"Bron",
    sourceHash:"Bronhash", sourceRow:"Bronregel", broker:"Broker", symbol:"Aandeel", quantity:"Aantal", price:"Prijs",
    currency:"Valuta", grossEur:"Bruto (€)", commissionEur:"Kosten (€)", netEur:"Netto (€)", nativeCash:"Cash in bronvaluta",
    assetClass:"Beleggingscategorie", exchange:"Beurs", processing:"Verwerking", newSymbol:"Nieuw aandeel", factor:"Factor",
    cashCurrency:"Rekeningvaluta", cashDelta:"Cashmutatie", settlementDate:"Afwikkeldatum", sourceValue:"Bronwaarde (€)",
    sourceFirstEntry:"Eerste inleg", sourceId:"Bron-ID", sourceUnits:"Brondeelbewijzen", sourceUnitTolerance:"Tolerantie deelbewijzen"
  };
  for (const kind of ["bank","broker","members"] as const) {
    const title = {bank:"Bankmutatie",broker:"Brokerregel",members:"Ledencontrole"}[kind];
    const index = (s: Snapshot | null) => new Map((s?.ledger?.[kind] ?? []).map(r=>[r.fund+"/"+r.id,r] as const));
    const older = index(previous), newer = index(next);
    for (const key of new Set([...older.keys(),...newer.keys()])) {
      const a=older.get(key), b=newer.get(key), row=(b ?? a)!;
      if (JSON.stringify(a) === JSON.stringify(b)) continue;
      const oldFields = new Map<string,Cell>(Object.entries(a ?? {})), newFields = new Map<string,Cell>(Object.entries(b ?? {}));
      for (const field of new Set([...oldFields.keys(),...newFields.keys()])) {
        if (field === "id" || field === "fund") continue;
        const before=oldFields.get(field) ?? null, after=newFields.get(field) ?? null;
        if (before !== after) change("Fonds "+row.fund,title+" "+row.id+" · "+(fieldNames[field] ?? field), before,after);
      }
    }
  }
  return { groups:[...groups].map(([name,changes])=>({name,changes})), warnings: missingPrices ? [(missingPrices === 1 ? "Eén eerder aangeleverd koerspunt ontbreekt" : missingPrices+" eerder aangeleverde koerspunten ontbreken")+" in dit bestand. Controleer de koershistorie vóór publicatie."] : [] };
}
