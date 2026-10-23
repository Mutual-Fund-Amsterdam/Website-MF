import type { FundValuePoint, Member, Snapshot } from "./types";

export type MemberHistoryPoint = { date: string; value: number; netInleg: number };

export function memberHistory(member: Member, snapshot: Snapshot, daily: FundValuePoint[]): MemberHistoryPoint[] {
  const events = (snapshot.transactions ?? []).filter((item) => item.fund === member.fund && item.memberId === member.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const first = events.find((event) => event.amount > 0)?.date;
  if (!first) return [];
  const dates = new Map<string, { nav: number; priority: number }>();
  for (const point of snapshot.fundHistory ?? []) if (point.fund === member.fund && point.date >= first) {
    dates.set(point.date, { nav: point.nav, priority: 1 });
  }
  for (const event of events) if (event.date >= first && !dates.has(event.date)) {
    dates.set(event.date, { nav: event.nav, priority: 2 });
  }
  for (const point of daily) if (point.fund === member.fund && point.date >= first && (!snapshot.ledger || point.coverage === "verified")) {
    dates.set(point.date, { nav: point.nav, priority: 3 });
  }
  let eventIndex = 0;
  let units = 0;
  let netInleg = 0;
  const result: MemberHistoryPoint[] = [];
  for (const [date, { nav }] of [...dates].sort((a, b) => a[0].localeCompare(b[0]))) {
    while (eventIndex < events.length && events[eventIndex].date <= date) {
      units += events[eventIndex].units;
      netInleg += events[eventIndex].amount;
      eventIndex++;
    }
    result.push({ date, value: Math.max(0, units * nav), netInleg });
  }
  return result;
}
