import type { FxRate } from "./types";

// ECB daily reference rates quote foreign-currency units per one euro.
export async function fetchEcbRates(): Promise<Partial<Record<"USD" | "CAD", FxRate>>> {
  const url = "https://data-api.ecb.europa.eu/service/data/EXR/D.USD+CAD.EUR.SP00.A?lastNObservations=1&format=csvdata";
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`ECB gaf status ${response.status}.`);
  const rows = (await response.text()).trim().split(/\r?\n/).map((line) => line.split(","));
  const header = rows.shift() ?? [];
  const currencyColumn = header.indexOf("CURRENCY");
  const dateColumn = header.indexOf("TIME_PERIOD");
  const valueColumn = header.indexOf("OBS_VALUE");
  if (currencyColumn < 0 || dateColumn < 0 || valueColumn < 0) throw new Error("ECB gaf geen herkenbare wisselkoersdata.");
  const rates: Partial<Record<"USD" | "CAD", FxRate>> = {};
  for (const row of rows) {
    const currency = row[currencyColumn];
    const date = row[dateColumn];
    const perEuro = Number(row[valueColumn]);
    if ((currency === "USD" || currency === "CAD") && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(perEuro) && perEuro > 0) {
      rates[currency] = { currency, date, perEuro };
    }
  }
  return rates;
}
