import { estimatedFundHistory, type EstimatedFundPoint } from "./estimated-history";
import { currentBookPoint } from "./book-valuation";
import type { DailyQuotes, FundNumber, FundValuePoint, Snapshot } from "./types";

/** One valuation per date for both return charts and the member's units. */
export function chartNav(snapshot: Snapshot, quotes: DailyQuotes | null, fund: FundNumber, daily: FundValuePoint[]) {
  const points = new Map(estimatedFundHistory(snapshot, quotes, fund).map(p => [p.date, p]));
  function add(date: string, nav: number) {
    const point: EstimatedFundPoint = { date, nav, lowNav: nav, highNav: nav, estimated: false, priceCoverage: 1 };
    if (Number.isFinite(nav) && nav > 0) points.set(date, point);
  }
  for (const p of daily) {
    if (p.fund !== fund) continue;
    if (p.coverage === "verified" || (p.coverage === "book" && p.cashConfirmed && snapshot.unitLedger && p.date >= snapshot.unitLedger.asOf[fund])) add(p.date, p.nav);
  }
  const current = currentBookPoint(snapshot, quotes, fund);
  if (current) add(current.date, current.nav);
  return [...points.values()].sort((a,b) => a.date.localeCompare(b.date));
}
