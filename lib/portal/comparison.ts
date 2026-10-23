import type {PerformancePoint} from "./performance";
import type {DailyQuotes} from "./types";
// This meeting baseline stays fixed when the calendar month changes.
export const FUND_RETURN_BASELINE="2026-09-16";
export type ComparisonPoint={date:string;fund:number;benchmark:number};
export function compareFundReturns(points:PerformancePoint[],baseline=FUND_RETURN_BASELINE):ComparisonPoint[]{
 const sorted=points.filter(p=>p.date>=baseline).sort((a,b)=>a.date.localeCompare(b.date));
 const base=sorted.find(p=>p.date===baseline);
 if(!base||base.nav<=0||base.benchmarkReturn===null)return [];
 return sorted.filter(p=>p.benchmarkReturn!==null&&p.nav>0).map(p=>({date:p.date,fund:p.nav/base.nav-1,benchmark:(1+p.benchmarkReturn!)/(1+base.benchmarkReturn!)-1}));
}

export type MeetingComparison={start:string;referenceDate:string|null;benchmarkMissing:boolean;points:{date:string;fund:number;benchmark:number|null}[]};
/** Reported fund performance: a carried opening reference is labelled, never a fabricated valuation. */
export function meetingComparison(points:PerformancePoint[],quotes:DailyQuotes|null,start=FUND_RETURN_BASELINE):MeetingComparison{
 const sorted=points.filter(p=>p.nav>0).sort((a,b)=>a.date.localeCompare(b.date));
 const base=sorted.filter(p=>p.date<=start).at(-1);
 if(!base)return {start,referenceDate:null,benchmarkMissing:true,points:[]};
 const benchmarkEur=(date:string)=>{
  const index=quotes?.benchmark?.points.filter(p=>p.date<=date).at(-1);
  const fx=quotes?.eurUsdHistory?.filter(p=>p.date<=date).at(-1);
  const weekday=new Date(date).getUTCDay();
  // No stale weekday close is relabelled as the requested trading date.
  if(!index||!fx||fx.close<=0||Date.parse(date)-Date.parse(fx.date)>7*86400000||Date.parse(date)-Date.parse(index.date)>4*86400000||weekday>0&&weekday<6&&index.date!==date)return null;
  return index.close/fx.close;
 };
 const bmBase=benchmarkEur(start);
 const rows:MeetingComparison['points']=[{date:start,fund:0,benchmark:0}];
 for(const p of sorted.filter(p=>p.date>start)){
  const bm=benchmarkEur(p.date);
  rows.push({date:p.date,fund:p.nav/base.nav-1,benchmark:bmBase!==null&&bm!==null?bm/bmBase-1:null});
 }
 return {start,referenceDate:base.date,benchmarkMissing:bmBase===null||rows.some(p=>p.benchmark===null),points:rows};
}
