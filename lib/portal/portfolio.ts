import { quoteKey } from "./marketstack";
import type { Cash, DailyQuotes, Position } from "./types";

const knownSectors: Record<string, string> = {
  ASML: "Technologie", CTPNV: "Vastgoed", PRX: "Communicatie", CCJ: "Energie",
  EXP: "Basismaterialen", LEU: "Energie", MA: "Financiële diensten", MSFT: "Technologie",
  NBIS: "Technologie", WKL: "Industrie", RBI: "Financiële diensten", CRWD: "Technologie",
  DE: "Industrie", SOFI: "Financiële diensten", TSM: "Technologie", V: "Financiële diensten",
  SPGI: "Financiële diensten", MNO: "Basismaterialen", ADYEN: "Financiële diensten",
  AIR: "Industrie", AVTX: "Basismaterialen", OCI: "Basismaterialen", CEG: "Nutsbedrijven",
  IBKR: "Financiële diensten", MU: "Technologie", OBDC: "Financiële diensten",
  PANW: "Technologie", TMC: "Basismaterialen", VCTR: "Financiële diensten",
  WMT: "Consumentengoederen", VRT: "Industrie",
};

export function sectorOf(position: Position): string {
  return position.sector?.trim() || knownSectors[position.ticker.toUpperCase()] || "Niet ingedeeld";
}

export function euroValue(amount: number, currency: string, quotes: DailyQuotes | null): number | null {
  if (currency === "EUR") return amount;
  if (currency !== "USD" && currency !== "CAD") return null;
  const rate = quotes?.fx?.[currency]?.perEuro;
  const age = quotes?.fx?.[currency]?.date ? Date.now() - Date.parse(`${quotes.fx[currency]!.date}T00:00:00Z`) : Infinity;
  return rate && rate > 0 && age >= 0 && age <= 8 * 86_400_000 ? amount / rate : null;
}

export function portfolioView(positions: Position[], cash: Cash | undefined, quotes: DailyQuotes | null) {
  const valued = positions.map((position) => {
    const candidate = quotes?.prices[quoteKey(position)] ?? null;
    const quoteAge = candidate ? Date.now() - Date.parse(`${candidate.date}T00:00:00Z`) : Infinity;
    const quote = quoteAge >= 0 && quoteAge <= 8 * 86_400_000 ? candidate : null;
    const valueEur = quote ? euroValue(position.quantity * quote.close, quote.currency, quotes) : null;
    return { position, quote, valueEur, sector: sectorOf(position) };
  });
  const stockComplete = valued.every((item) => item.valueEur !== null);
  const stockValue = stockComplete ? valued.reduce((sum, item) => sum + item.valueEur!, 0) : null;
  const ing = cash?.ingEur;
  const brokerEur = cash?.brokerEur;
  const usd = cash?.brokerUsd;
  const cad = cash?.brokerCad;
  const usdEur = usd === null || usd === undefined || usd === 0 ? 0 : euroValue(usd, "USD", quotes);
  const cadEur = cad === null || cad === undefined || cad === 0 ? 0 : euroValue(cad, "CAD", quotes);
  const cashComplete = ing !== null && ing !== undefined && brokerEur !== null && brokerEur !== undefined && usdEur !== null && cadEur !== null;
  const cashValue = cashComplete ? ing! + brokerEur! + usdEur! + cadEur! : null;
  const otherValue = cash?.otherEur ?? 0;
  const fundValue = stockValue !== null && cashValue !== null ? stockValue + cashValue + otherValue : null;
  const sectors = new Map<string, number>();
  for (const item of valued) {
    if (item.valueEur !== null) sectors.set(item.sector, (sectors.get(item.sector) ?? 0) + item.valueEur);
  }
  return {
    valued, stockValue, cashValue, otherValue, fundValue,
    sectors: [...sectors].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    missing: valued.filter((item) => item.valueEur === null).map((item) => item.position.name),
  };
}
