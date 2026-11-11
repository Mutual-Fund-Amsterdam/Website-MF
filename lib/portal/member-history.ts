import type { FundValuePoint, FundHistoryPoint, Member, Snapshot } from "./types";
import {cashReviewIssues} from './cash-review';
import type {EstimatedFundPoint} from "./estimated-history";

export type MemberHistoryPoint = { date: string; value: number; netInleg: number; indicative?:boolean };

export function memberHistory(member: Member, snapshot: Snapshot, daily: FundValuePoint[], reconstructed:EstimatedFundPoint[]=[],current?:FundHistoryPoint|null): MemberHistoryPoint[] {
  const events = (snapshot.transactions ?? []).filter((item) => item.fund === member.fund && item.memberId === member.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const first = events.find((event) => event.amount > 0)?.date;
  if (!first) return [];
  const dates = new Map<string, { nav: number; priority: number; indicative?:boolean }>();
  for (const point of snapshot.fundHistory ?? []) if (point.fund === member.fund && point.date >= first) {
    dates.set(point.date, { nav: point.nav, priority: 1 });
  }
  for (const event of events) if (event.date >= first && !dates.has(event.date)) {
    dates.set(event.date, { nav: event.nav, priority: 2 });
  }
  for (const point of daily) if (point.fund === member.fund && point.date >= first && (!snapshot.ledger || point.coverage === "verified"||snapshot.unitLedger&&point.coverage==='book'&&point.cashConfirmed===true&&point.date>=snapshot.unitLedger.asOf[member.fund])) {
    dates.set(point.date, { nav: point.nav, priority: 3 });
  }
  for(const point of reconstructed)if(point.date>=first&&!dates.has(point.date))dates.set(point.date,{nav:point.nav,priority:0,indicative:point.estimated});
  if(current&&current.fund===member.fund&&current.date>=first)dates.set(current.date,{nav:current.nav,priority:4});
  return memberValuesAtNav(member,snapshot,[...dates].map(([date,p])=>({date,nav:p.nav,estimated:p.indicative})));
}

// The archive recycled four participant numbers. Pair the original rows
// with the later subscription so corrected imports with separate owner IDs
// keep showing the former participant's own cash flows.
const reassignedRows=[
  [655,153,220], [656,154,274], [657,160,221], [658,161,269]
];
const archiveRow=(row:number)=>`Admin Fonds 2 9 Nov 2026.xlsm / Transacties ${row}`;

export function memberValuesAtNav(member:Member,snapshot:Snapshot,points:{date:string;nav:number;estimated?:boolean}[]):MemberHistoryPoint[]{
  const events=(snapshot.transactions??[]).filter(e=>e.fund===member.fund&&e.memberId===member.id).sort((a,b)=>a.date.localeCompare(b.date));
  const previousOwner=new Set<string>();
 if(member.fund===2)for(const [subscription,...oldRows] of reassignedRows){
  if(events.some(e=>e.source===archiveRow(subscription)))for(const r of oldRows)previousOwner.add(archiveRow(r));
 }
 const first=events.find(e=>e.amount>0&&!previousOwner.has(e.source))?.date;
  if(!first)return [];
  let eventIndex = 0;
  let units = 0;
  let netInleg = 0;
  const result: MemberHistoryPoint[] = [];
  for (const {date,nav,estimated:indicative} of [...points].sort((a,b)=>a.date.localeCompare(b.date))) {
    if(date<first)continue;
    while (eventIndex < events.length && events[eventIndex].date <= date) {
      units += events[eventIndex].units;
      // The checked closing units include any sub-cent rounding carry. Only
      // this owner's deposits and withdrawals contribute to their net payment.
      if(!previousOwner.has(events[eventIndex].source))netInleg += events[eventIndex].amount;
      eventIndex++;
    }
    const unresolvedCash=cashReviewIssues(snapshot,member.fund).length>0;
    const beforeCheckedBasis=!!snapshot.unitLedger&&date<snapshot.unitLedger.asOf[member.fund];
    result.push({ date, value: Math.max(0, units * nav), netInleg,...(indicative||beforeCheckedBasis||unresolvedCash?{indicative:true}:{}) });
  }
  return result;
}
