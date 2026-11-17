import type { AdminView } from "./model";
export function membershipRegister(data: AdminView) {
  type Row = { name: string; id: string; fund: number | null; active: boolean; units: number | null; periods: string[]; sources: string[] };
  const rows: Row[] = data.members.map(m => ({ name: m.name, id: m.id, fund: m.fund, active: m.active,
    units: m.participation == null || data.units?.[m.fund] == null ? null : m.participation * data.units[m.fund],
    periods: [], sources: ["Financiële administratie"] }));
  const key = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const row of rows) {
    // Observed transaction years are not an inferred uninterrupted membership period.
    row.periods = [...new Set(data.transactions.filter(t => t.memberId === row.id && t.fund === row.fund).map(t => t.date.slice(0, 4)))];
    if (row.active) row.periods.push(String(new Date().getFullYear()));
  }
  for (const a of data.archive) {
    const matches = rows.filter(r => key(r.name) === key(a.name));
    let row = matches.find(r => a.fund && r.fund === a.fund);
    if (!row && matches.length === 1 && (!a.fund || !matches[0].fund)) row = matches[0];
    if (!row) { row = { name: a.name, id: "", fund: a.fund, active: false, units: null, periods: [], sources: [] }; rows.push(row); }
    if (a.period) row.periods.push(a.period);
    if (a.source) row.sources.push(a.source);
  }
  return rows.map(r => ({ ...r, periods: [...new Set(r.periods)].sort(), sources: [...new Set(r.sources)] }));
}
export function periodYears(periods: string[]) {
  const result = new Set<number>();
  for (const period of periods) {
    const years = (period.match(/(?:19|20)\d{2}/g) || []).map(Number);
    for (const y of years) result.add(y);
    if (years.length === 2 && years[1] >= years[0] && years[1] - years[0] <= 20) for (let y = years[0]; y <= years[1]; y++) result.add(y);
  }
  return result;
}
