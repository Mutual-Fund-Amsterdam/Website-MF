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
const TEN_YEARS_DAYS = 3653;
const BACKFILL_PER_REFRESH = 4;

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
  const all = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const oldest = new Date(Date.now() - TEN_YEARS_DAYS * 86_400_000).toISOString().slice(0, 10);
  const dailyFrom = new Date(Date.now() - 366 * 86_400_000).toISOString().slice(0, 10);
  const weekly = new Map<string, PricePoint>();
  const daily: PricePoint[] = [];
  for (const point of all) {
    if (point.date < oldest) continue;
    if (point.date >= dailyFrom) daily.push(point);
    else {
      const day = new Date(`${point.date}T00:00:00Z`);
      day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
      weekly.set(day.toISOString().slice(0, 10), point);
    }
  }
  return [...weekly.values(), ...daily];
}

function rowsForPosition(rows: Array<Record<string, unknown>>, position: Position, mic: string, todayAmsterdam: string): PricePoint[] {
  return rows.filter((row) => String(row.symbol ?? "").toUpperCase() === symbolFor(position, mic).toUpperCase()
      && String(row.exchange ?? "").toUpperCase() === mic
      && String(row.price_currency ?? "").toUpperCase() === position.currency.toUpperCase())
    .map((row) => ({ date: validDate(row.date), close: Number(row.close) }))
    .filter((point): point is PricePoint => point.date !== null && point.date < todayAmsterdam && Number.isFinite(point.close) && point.close > 0);
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
    // The legacy index endpoint reports total=1000 on every full page, so
    // continue until a page contains fewer rows than the requested limit.
    if (payload.data.length < 1000) return results;
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
    if (payload.data.length < 1000) return results;
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
  const historyBackfilled = new Set(previous?.historyBackfilled ?? []);
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

  // Historical retrieval is spread over several daily jobs. One symbol costs at
  // most eight paginated calls, and never runs in response to a member visit.
  const pending = [...unique.values()].filter((position) => !historyBackfilled.has(quoteKey(position))).slice(0, BACKFILL_PER_REFRESH);
  const tenYearsAgo = new Date(Date.now() - TEN_YEARS_DAYS * 86_400_000).toISOString().slice(0, 10);
  for (const position of pending) {
    const id = quoteKey(position);
    const mic = providerVenue[position.ticker.toUpperCase()] ?? exchangeMic[position.exchange];
    try {
      const rows = await marketstackRows([symbolFor(position, mic)], mic, key, tenYearsAgo);
      history[id] = mergeHistory(history[id] ?? [], rowsForPosition(rows, position, mic, todayAmsterdam));
      historyBackfilled.add(id);
    } catch {
      // The regular close remains available; this symbol is retried tomorrow.
    }
  }

  // Basic includes indices. A missing index never prevents publication of stock quotes.
  let benchmark = previous?.benchmark;
  try {
    const last = previous?.benchmark?.latest?.date;
    const benchmarkBackfilled = historyBackfilled.has(INDEX_SYMBOL);
    const from = benchmarkBackfilled ? new Date(Date.now() - 8 * 86_400_000).toISOString().slice(0, 10) : tenYearsAgo;
    const rows = await benchmarkRows(key, from);
    const fresh = rows.filter((row) => String(row.symbol ?? "").toUpperCase() === INDEX_SYMBOL && String(row.exchange ?? "").toUpperCase() === "INDX")
      .map((row) => ({ date: validDate(row.date), close: Number(row.close) }))
      .filter((point): point is PricePoint => point.date !== null && point.date < todayAmsterdam && Number.isFinite(point.close) && point.close > 0);
    const points = mergeHistory(benchmark?.points ?? [], fresh);
    benchmark = { name: "S&P 500", points, latest: points.at(-1) ?? null };
    if (!benchmarkBackfilled) historyBackfilled.add(INDEX_SYMBOL);
  } catch {
    // Keep existing data; the UI displays a missing-data state if no series exists.
  }
  return { fetchedAt: new Date().toISOString(), prices, history, historyBackfilled: [...historyBackfilled], benchmark };
}
