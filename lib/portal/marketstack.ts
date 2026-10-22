import type { DailyQuote, DailyQuotes, Position, PricePoint } from "./types";

const exchangeMic: Record<string, string> = {
  "Euronext Amsterdam": "XAMS",
  "Euronext Paris": "XPAR",
  "NYSE American": "XASE",
  Nasdaq: "XNAS",
  "New York Stock Exchange": "XNYS",
  "Toronto Stock Exchange": "XTSE",
  "Vienna Stock Exchange": "XWBO",
};

// Marketstack currently files these US symbols under XNYS although the
// administration lists a different venue. Keep the Excel venue unchanged.
const providerVenue: Record<string, string> = { LEU: "XNYS", CEG: "XNYS", PANW: "XNYS", WMT: "XNYS" };

const INDEX_SYMBOL = "GSPC.INDX";
const MAX_SYMBOLS = 80;
const MAX_PAGES = 8;

export function quoteKey(position: Pick<Position, "ticker" | "exchange">): string {
  return `${position.exchange}:${position.ticker.toUpperCase()}`;
}

function validDate(value: unknown): string | null {
  const date = String(value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function symbolFor(position: Position, mic: string): string {
  return ["XNAS", "XNYS", "XASE"].includes(mic) ? position.ticker : position.marketSymbol || `${position.ticker}.${mic}`;
}

function mergeHistory(old: PricePoint[], fresh: PricePoint[]): PricePoint[] {
  const byDate = new Map([...old, ...fresh].map((point) => [point.date, point]));
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-260);
}

async function marketstackRows(symbols: string[], mic: string | null, key: string, from: string): Promise<Array<Record<string, unknown>>> {
  const results: Array<Record<string, unknown>> = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL("https://api.marketstack.com/v2/eod");
    url.searchParams.set("access_key", key);
    url.searchParams.set("symbols", symbols.join(","));
    if (mic && ["XNAS", "XNYS", "XASE"].includes(mic)) url.searchParams.set("exchange", mic);
    url.searchParams.set("date_from", from);
    url.searchParams.set("limit", "1000");
    url.searchParams.set("offset", String(page * 1000));
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`Marketstack gaf status ${response.status}.`);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) {
      throw new Error("Marketstack gaf geen geldige koerslijst terug.");
    }
    results.push(...payload.data as Array<Record<string, unknown>>);
    const pagination = "pagination" in payload ? payload.pagination as { total?: number } : null;
    const total = Number(pagination?.total ?? results.length);
    if (!Number.isFinite(total) || total <= results.length || payload.data.length === 0) return results;
  }
  throw new Error("Marketstack-historie is te lang voor de ingestelde paginalimiet.");
}

async function benchmarkRows(key: string, from: string): Promise<Array<Record<string, unknown>>> {
  const results: Array<Record<string, unknown>> = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    // The v2 EOD endpoint rejects index symbols. Marketstack still serves
    // historical index closes through its documented legacy v1 endpoint.
    const url = new URL("https://api.marketstack.com/v1/eod");
    url.searchParams.set("access_key", key);
    url.searchParams.set("symbols", INDEX_SYMBOL);
    url.searchParams.set("date_from", from);
    url.searchParams.set("limit", "1000");
    url.searchParams.set("offset", String(page * 1000));
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`Marketstack-index gaf status ${response.status}.`);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) throw new Error("Geen geldige indexdata.");
    results.push(...payload.data as Array<Record<string, unknown>>);
    const pagination = "pagination" in payload ? payload.pagination as { total?: number } : null;
    const total = Number(pagination?.total ?? results.length);
    if (!Number.isFinite(total) || total <= results.length || payload.data.length === 0) return results;
  }
  throw new Error("Indexhistorie overschrijdt de paginalimiet.");
}

function historyStart(keys: string[], previous: DailyQuotes | null): string {
  const known = keys.map((key) => previous?.history?.[key]?.at(-1)?.date).filter((date): date is string => Boolean(date));
  const days = known.length === keys.length ? 8 : 180;
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export async function fetchDailyQuotes(positions: Position[], key: string, previous: DailyQuotes | null): Promise<DailyQuotes> {
  const todayAmsterdam = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const unique = new Map(positions.map((position) => [quoteKey(position), position]));
  if (unique.size > MAX_SYMBOLS) throw new Error("Meer dan 80 beursposities; controleer eerst het Marketstack-abonnement.");
  const groups = new Map<string, Position[]>();
  for (const position of unique.values()) {
    const mic = providerVenue[position.ticker.toUpperCase()] ?? exchangeMic[position.exchange];
    if (!mic) throw new Error(`Geen beurscode voor ${position.exchange}.`);
    groups.set(mic, [...(groups.get(mic) ?? []), position]);
  }

  const prices: Record<string, DailyQuote> = { ...previous?.prices };
  const history: Record<string, PricePoint[]> = { ...previous?.history };
  for (const [mic, group] of groups) {
    const lookup = new Map(group.map((position) => [symbolFor(position, mic).toUpperCase(), position]));
    const rows = await marketstackRows([...lookup.keys()], mic, key, historyStart(group.map(quoteKey), previous));
    const fresh = new Map<string, PricePoint[]>();
    for (const row of rows) {
      const position = lookup.get(String(row.symbol ?? "").toUpperCase());
      if (!position || String(row.exchange ?? "").toUpperCase() !== mic) continue;
      if (String(row.price_currency ?? "").toUpperCase() !== position.currency.toUpperCase()) continue;
      const close = Number(row.close);
      const date = validDate(row.date);
      if (!date || date >= todayAmsterdam || !Number.isFinite(close) || close <= 0) continue;
      const keyForPosition = quoteKey(position);
      fresh.set(keyForPosition, [...(fresh.get(keyForPosition) ?? []), { date, close }]);
    }
    for (const position of group) {
      const id = quoteKey(position);
      history[id] = mergeHistory(history[id] ?? [], fresh.get(id) ?? []);
      const latest = history[id].at(-1);
      if (latest) prices[id] = { symbol: position.ticker, exchange: mic, currency: position.currency, ...latest };
    }
  }

  // Basic includes indices. A missing index never prevents publication of stock quotes.
  let benchmark = previous?.benchmark;
  try {
    const last = previous?.benchmark?.latest?.date;
    const from = new Date(Date.now() - (last ? 8 : 180) * 86_400_000).toISOString().slice(0, 10);
    const rows = await benchmarkRows(key, from);
    const fresh = rows.filter((row) => String(row.symbol ?? "").toUpperCase() === INDEX_SYMBOL && String(row.exchange ?? "").toUpperCase() === "INDX")
      .map((row) => ({ date: validDate(row.date), close: Number(row.close) }))
      .filter((point): point is PricePoint => point.date !== null && point.date < todayAmsterdam && Number.isFinite(point.close) && point.close > 0);
    const points = mergeHistory(benchmark?.points ?? [], fresh);
    benchmark = { name: "S&P 500", points, latest: points.at(-1) ?? null };
  } catch {
    // Keep existing data; the UI displays a missing-data state if no series exists.
  }
  return { fetchedAt: new Date().toISOString(), prices, history, benchmark };
}
