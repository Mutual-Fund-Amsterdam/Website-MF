import type {PerformancePoint} from "./performance";
import type {DailyQuotes} from "./types";
import type {EstimatedFundPoint} from "./estimated-history";
// This meeting baseline stays fixed when the calendar month changes.
export const FUND_RETURN_BASELINE="2026-09-16";
export type ComparisonPoint={date:string;fund:number;benchmark:number};
export function compareFundReturns(points:PerformancePoint[],baseline=FUND_RETURN_BASELINE):ComparisonPoint[]{
 const sorted=points.filter(p=>p.date>=baseline).sort((a,b)=>a.date.localeCompare(b.date));
 const base=sorted.find(p=>p.date===baseline);
 if(!base||base.nav<=0||base.benchmarkReturn===null)return [];
 return sorted.filter(p=>p.benchmarkReturn!==null&&p.nav>0).map(p=>({date:p.date,fund:p.nav/base.nav-1,benchmark:(1+p.benchmarkReturn!)/(1+base.benchmarkReturn!)-1}));
}

export type MeetingComparison={start:string;referenceDate:string|null;benchmarkMissing:boolean;dailyFrom?:string|null;points:{date:string;fund:number;benchmark:number|null;band?:[number,number];estimated?:boolean;priceCoverage?:number}[]};

export function comparisonModes(points:EstimatedFundPoint[],quotes:DailyQuotes|null,earliest="2022-09-21"){
 const first=points.find(p=>p.date>=earliest&&p.nav>0&&quotes?.benchmark?.points.some(b=>b.date===p.date)&&quotes?.eurUsdHistory?.some(f=>f.date<=p.date&&f.close>0&&Date.parse(p.date)-Date.parse(f.date)<=7*86400000));
 const year=historicalComparison(points,quotes,FUND_RETURN_BASELINE);
 year.points=year.points.filter(p=>p.date>=FUND_RETURN_BASELINE);
 const historical=first?historicalComparison(points,quotes,first.date):{start:points[0]?.date??FUND_RETURN_BASELINE,referenceDate:null,benchmarkMissing:true,points:[]} satisfies MeetingComparison;
 historical.points=historical.points.filter(p=>p.date>=historical.start);
 return {year,historical};
}

/** A display window never resets the meeting's 0% baseline. */
export function historicalComparison(points:EstimatedFundPoint[],quotes:DailyQuotes|null,start=FUND_RETURN_BASELINE):MeetingComparison{
 const base=points.find(p=>p.date===start)??points.filter(p=>p.date<start).at(-1);
 if(!base)return {start,referenceDate:null,benchmarkMissing:true,points:[]};
 const eur=(date:string)=>{
  const p=quotes?.benchmark?.points.filter(p=>p.date<=date).at(-1),fx=quotes?.eurUsdHistory?.filter(p=>p.date<=date).at(-1);
  return p&&fx&&fx.close>0&&Date.parse(date)-Date.parse(p.date)<=4*86400000&&Date.parse(date)-Date.parse(fx.date)<=7*86400000?p.close/fx.close:null;
 };
 const bmBase=eur(start);
 const rows=points.map(p=>{
  const bm=eur(p.date),a=(p.flatNav??p.nav)/(base.flatNav??base.nav)-1,b=(p.marketNav??p.nav)/(base.marketNav??base.nav)-1;
  return {date:p.date,fund:p.date===start?0:p.nav/base.nav-1,benchmark:bm&&bmBase?bm/bmBase-1:null,band:[Math.min(a,b),Math.max(a,b)] as [number,number],estimated:p.estimated,priceCoverage:p.priceCoverage};
 });
 if(!rows.some(p=>p.date===start)&&rows.some(p=>p.date>start))rows.push({date:start,fund:0,benchmark:bmBase?0:null,band:[0,0],estimated:true,priceCoverage:0});
 rows.sort((a,b)=>a.date.localeCompare(b.date));
 return {start,referenceDate:base.date,benchmarkMissing:rows.some(p=>p.benchmark===null),dailyFrom:points.find(p=>p.estimated)?.date??null,points:rows};
}

export type FundChartPeriod="fund-year"|"6m"|"1y"|"2y"|"all";
export function chartPeriod(points:MeetingComparison['points'],period:FundChartPeriod,baseline=FUND_RETURN_BASELINE){
 if(period==="all")return points;
 if(period==="fund-year")return points.filter(p=>p.date>=baseline);
 const end=points.at(-1)?.date;if(!end)return [];
 const cutoff=new Date(end+"T12:00:00Z");
 if(period==="6m")cutoff.setUTCMonth(cutoff.getUTCMonth()-6);else cutoff.setUTCFullYear(cutoff.getUTCFullYear()-(period==="1y"?1:2));
 return points.filter(p=>p.date>=cutoff.toISOString().slice(0,10));
}
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
