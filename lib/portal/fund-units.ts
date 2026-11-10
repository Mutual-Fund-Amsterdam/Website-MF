import type {FundNumber,Snapshot} from './types';
/** Source unit events own the pool, including inactive members before retirement.
 * Legacy index totals are not substituted for the checked member ledger. */
export function fundUnitsAt(snapshot:Snapshot,fund:FundNumber,date:string):number|null{
 if(snapshot.unitLedger){
  const units=(snapshot.transactions??[]).filter(e=>e.fund===fund&&e.date<=date).reduce((s,e)=>s+e.units,0);
  return Number.isFinite(units)&&units>0?units:null;
 }
 const p=(snapshot.fundHistory??[]).filter(p=>p.fund===fund&&p.date<=date).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
 if(!p)return null;
 const units=p.totalUnits+(snapshot.transactions??[]).filter(e=>e.fund===fund&&e.date>p.date&&e.date<=date).reduce((s,e)=>s+e.units,0);
 return Number.isFinite(units)&&units>0?units:null;
}
