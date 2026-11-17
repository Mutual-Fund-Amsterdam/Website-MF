import type { Cash, FundNumber } from "../types";
import { AdminError } from "./model";
export type CashEntry = { fund: FundNumber; bank: "ING" | "Saxo"; currency: string; date: string; amount: number; absolute: boolean };
/** Baseline already contains all prior bookings. New entries apply once, including on its date.
 * An absolute observation includes earlier dates and earlier entries on the same date. */
export function replayCash(base: Cash[], entries: CashEntry[]): Cash[] {
  const result = structuredClone(base);
  const groups = new Map<string, CashEntry[]>();
  for (const e of entries) {
    const key = [e.fund, e.bank, e.currency].join("|");
    groups.set(key, [...(groups.get(key) || []), e]);
  }
  for (const rows of groups.values()) {
    const { fund, bank, currency } = rows[0], c = result.find(c => c.fund === fund);
    if (!c) throw new AdminError("Cashrekening ontbreekt voor dit fonds.");
    const field = bank === "ING" ? "ingEur" : ({ EUR: "brokerEur", USD: "brokerUsd", CAD: "brokerCad" } as const)[currency as "EUR" | "USD" | "CAD"];
    const prior = base.find(c => c.fund === fund)!;
    let amount = field ? prior[field] : prior.extraBalances?.[currency]?.amount ?? null;
    let date = bank === "ING" ? prior.ingAsOf : field ? prior.brokerAsOf : prior.extraBalances?.[currency]?.date ?? null;
    for (const e of rows.toSorted((a, b) => a.date.localeCompare(b.date))) {
      if (date && e.date < date) throw new AdminError("De boeking ligt vóór de bestaande cashstand. Gebruik historische registratie als zij al verwerkt is.");
      if (e.absolute) amount = e.amount;
      else {
        if (amount === null) throw new AdminError("Voer eerst het beginsaldo van deze rekening in.");
        amount += e.amount;
      }
      date = e.date;
    }
    const rounded = amount === null ? null : Math.round((amount + Number.EPSILON) * 100) / 100;
    if (field) {
      c[field] = rounded;
      const dateField = bank === "ING" ? "ingAsOf" : "brokerAsOf";
      c[dateField] = [c[dateField], date].filter(Boolean).sort().at(-1) || null;
    } else c.extraBalances = { ...c.extraBalances, [currency]: { amount: rounded!, date: date! } };
  }
  return result;
}
