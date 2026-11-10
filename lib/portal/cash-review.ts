import type {FundNumber,Snapshot} from './types';
/** An old translated cash report minus an unmatched bank transfer is a
 * reconciliation remainder, never a separately confirmed broker closing. */
export function cashReviewIssues(snapshot:Snapshot,fund:FundNumber):string[]{
 const cash=(snapshot.cash??[]).find(c=>c.fund===fund),ledger=snapshot.ledger;
 if(!cash?.basisNote?.includes('EUR-rapportwaarde')||!ledger)return [];
 const report=ledger.broker.filter(e=>e.fund===fund&&e.broker==='IBKR'&&e.kind==='Brokersluiting').sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
 if(!report)return [];
 const unmatched=ledger.bank.filter(e=>e.fund===fund&&e.kind==='Brokertransfer'&&e.date>report.date&&!e.matchId);
 if(!unmatched.length)return [];
 return [`Na de IBKR-rapportdatum ${report.date} is een bankoverboeking geregistreerd zonder aansluitende broker-eindstand. Een berekend restbedrag bevestigt het actuele cashsaldo niet.`];
}
