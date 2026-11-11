import type {Member} from './types';
import {FUND_RETURN_BASELINE} from './comparison';

const DAY=86400000;
export const COMPARISON_FUNDS=[1,2,3] as const;
export function canCompareFunds(member:Pick<Member,'role'|'active'>){
 return member.active&&member.role.trim().toLowerCase()==='hoofdbestuurder';
}
export type ComparisonNav={date:string;nav:number;estimated?:boolean};
export type ComparisonDay={date:string;timestamp:number;fund1:number|null;fund2:number|null;fund3:number|null};
/** NAV return removes the effect of issuing/redeeming units. Missing observations
 * remain missing; the caller retains the historical model's reconstruction flag. */
export function comparisonCalendar(histories:Record<1|2|3,ComparisonNav[]>,asOf:string){
 const baseline=Date.parse(FUND_RETURN_BASELINE+'T00:00:00Z');
 const series=COMPARISON_FUNDS.map(fund=>{
  const rows=histories[fund].filter(p=>p.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date));
  return {fund,base:rows.find(p=>p.date===FUND_RETURN_BASELINE),byDate:new Map(rows.map(p=>[p.date,p]))};
 });
 const days:ComparisonDay[]=[];let reconstructed=false;
 for(let t=baseline;t<=Date.parse(asOf+'T00:00:00Z');t+=DAY){
  const date=new Date(t).toISOString().slice(0,10);
  const day:ComparisonDay={date,timestamp:t,fund1:null,fund2:null,fund3:null};
  for(const s of series){
   const point=s.byDate.get(date);
   if(point&&s.base&&Number.isFinite(point.nav)&&point.nav>0&&Number.isFinite(s.base.nav)&&s.base.nav>0){
    day[`fund${s.fund}`]=point.nav/s.base.nav-1;
    reconstructed||=!!point.estimated||!!s.base.estimated;
   }
  }
  days.push(day);
 }
 return {days,reconstructed};
}
/** The same four-week labels as the supplied fund-year chart. Future dates are
 * axis space only; no future valuation observations are generated. */
export function comparisonAxis(asOf:string){
 const start=Date.parse('2026-09-15T00:00:00Z');
 const end=Math.max(start+280*DAY,Date.parse(asOf+'T00:00:00Z'));
 const ticks=[];for(let t=start;t<end;t+=28*DAY)ticks.push(t);
 return {start,end,ticks};
}
