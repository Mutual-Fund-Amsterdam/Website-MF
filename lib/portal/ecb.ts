import type { FxRate, PricePoint } from "./types";

export async function fetchCurrencyHistory(currency:string,previous:PricePoint[]=[]):Promise<PricePoint[]>{
  if(!["USD","CAD","GBP","CHF","PLN","SEK","NOK","AUD","JPY","DKK","HUF","CZK","HKD"].includes(currency))throw new Error("Geen ondersteunde ECB-valuta.");
  const from=previous.at(-1)?.date??"2011-01-01";
  const response=await fetch(`https://data-api.ecb.europa.eu/service/data/EXR/D.${currency}.EUR.SP00.A?startPeriod=${from}&format=csvdata`,{cache:"no-store",signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error("ECB-valutahistorie ontbreekt.");
  const rows=(await response.text()).trim().split(/\r?\n/).map(r=>r.split(','));const header=rows.shift()??[];
  const d=header.indexOf('TIME_PERIOD'),v=header.indexOf('OBS_VALUE');if(d<0||v<0)throw new Error("Onbekende ECB-kolommen.");
  const map=new Map(previous.map(p=>[p.date,p]));for(const r of rows)if(/^\d{4}-\d{2}-\d{2}$/.test(r[d])&&Number(r[v])>0)map.set(r[d],{date:r[d],close:Number(r[v])});
  return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

export async function fetchEurUsdHistory(previous: PricePoint[] = []): Promise<PricePoint[]> {
  const from = previous.at(-1)?.date ?? "2011-01-01";
  const response = await fetch(`https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?startPeriod=${from}&format=csvdata`, {cache:"no-store",signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error("Historische EUR/USD ontbreekt.");
  const rows=(await response.text()).trim().split(/\r?\n/).map(r=>r.split(','));const header=rows.shift()??[];
  const d=header.indexOf('TIME_PERIOD'),v=header.indexOf('OBS_VALUE');
  if(d<0||v<0)throw new Error("Onbekende ECB-kolommen.");
  const merged=new Map(previous.map(p=>[p.date,p]));
  for(const r of rows)if(/^\d{4}-\d{2}-\d{2}$/.test(r[d])&&Number(r[v])>0)merged.set(r[d],{date:r[d],close:Number(r[v])});
  return [...merged.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

/** Percent per annum, ECB ACT/360 overnight convention. */
export async function fetchEstrHistory(previous: PricePoint[] = []): Promise<PricePoint[]> {
  const from=previous.at(-1)?.date ?? "2019-10-01";
  const response=await fetch(`https://data-api.ecb.europa.eu/service/data/EST/B.EU000A2X2A25.WT?startPeriod=${from}&format=csvdata`,{cache:"no-store",signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error("€STR-historie ontbreekt.");
  const rows=(await response.text()).trim().split(/\r?\n/).map(r=>r.split(','));const header=rows.shift()??[];
  const d=header.indexOf('TIME_PERIOD'),v=header.indexOf('OBS_VALUE');
  if(d<0||v<0)throw new Error("Onbekende ECB-kolommen.");
  const merged=new Map(previous.map(p=>[p.date,p]));
  for(const r of rows)if(/^\d{4}-\d{2}-\d{2}$/.test(r[d])&&r[v]!==""&&Number.isFinite(Number(r[v])))merged.set(r[d],{date:r[d],close:Number(r[v])});
  return [...merged.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

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
