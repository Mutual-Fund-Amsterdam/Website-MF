import type { DailyQuotes, FundNumber, FundValuePoint, PricePoint, RiskMetrics, Snapshot } from "./types";

export type PerformancePoint = { date: string; value: number; nav: number; fundReturn: number; benchmarkReturn: number | null };
export function prior(points: PricePoint[], date: string, maxDays = 7): PricePoint | undefined {
  const point = points.filter(p => p.date <= date).at(-1);
  return point && (Date.parse(date) - Date.parse(point.date)) / 86400000 <= maxDays ? point : undefined;
}
/** Unit prices neutralise external deposits/withdrawals. Never backcast today's holdings. */
export function fundPerformance(snapshot: Snapshot, fund: FundNumber, daily: FundValuePoint[], quotes: DailyQuotes | null): PerformancePoint[] {
  const rows = new Map((snapshot.fundHistory ?? []).filter(p => p.fund === fund && p.totalUnits > .01).map(p => [p.date, { date: p.date, nav: p.nav, value: p.nav * p.totalUnits }]));
  const lastHistorical = [...rows.keys()].sort().at(-1) ?? "";
  for (const p of daily) if (p.fund === fund && (p.coverage === "verified" || (!snapshot.ledger && p.date > lastHistorical))) rows.set(p.date, { date: p.date, nav: p.nav, value: p.fundValue });
  const points = [...rows.values()].sort((a,b) => a.date.localeCompare(b.date));
  const base = points[0]?.nav;
  let benchmarkBase: number | undefined;
  return points.map(p => {
    const price = prior(quotes?.benchmark?.points ?? [], p.date);
    const fx = prior(quotes?.eurUsdHistory ?? [], p.date);
    const eur = price && fx ? price.close / fx.close : undefined;
    if (eur && benchmarkBase === undefined) benchmarkBase = eur;
    return {...p, fundReturn: base ? p.nav / base - 1 : 0, benchmarkReturn: eur && benchmarkBase ? eur / benchmarkBase - 1 : null};
  });
}

export function dailyChange(history: PricePoint[], date: string, close: number): number | null {
  const previous = history.filter(p => p.date < date).at(-1);
  return previous ? close / previous.close - 1 : null;
}

export function realisedRisk(points: PerformancePoint[], estr: PricePoint[] = [], today = new Date().toISOString().slice(0,10)): RiskMetrics {
  const monthly=new Map<string,PerformancePoint>();
  for(const p of points) {
    const end=new Date(Date.UTC(Number(p.date.slice(0,4)),Number(p.date.slice(5,7)),0)).toISOString().slice(0,10);
    if(end<today)monthly.set(end,p);
  }
  const rows=[...monthly].sort(([a],[b])=>a.localeCompare(b));
  const returns=rows.slice(1).map(([date,p],i)=>{
    const [previousDate,previous]=rows[i];
    const consecutive=(Date.parse(date)-Date.parse(previousDate))/86400000<=32
      && Date.parse(date)-Date.parse(p.date)<=4*86400000
      && Date.parse(previousDate)-Date.parse(previous.date)<=4*86400000;
    let factor=1,valid=true;const d=new Date(date.slice(0,7)+'-01T00:00:00Z');
    while(d.toISOString().slice(0,10)<=date){const rate=prior(estr,d.toISOString().slice(0,10));if(!rate){valid=false;break;}factor*=1+rate.close/100/360;d.setUTCDate(d.getUTCDate()+1);}
    return {ret:consecutive?p.nav/previous.nav-1:null,bm:consecutive&&p.benchmarkReturn!==null&&previous.benchmarkReturn!==null?(1+p.benchmarkReturn)/(1+previous.benchmarkReturn)-1:null,rf:valid?factor-1:null};
  }).slice(-12);
  const mean=(a:number[])=>a.reduce((s,v)=>s+v,0)/a.length;
  const r=returns.map(p=>p.ret).filter((p):p is number=>p!==null);
  const variance=r.length===12?r.reduce((s,v)=>s+(v-mean(r))**2,0)/11:null;
  const vol=variance===null?null:Math.sqrt(variance*12);
  const excess=returns.filter(p=>p.ret!==null&&p.rf!==null).map(p=>p.ret!-p.rf!);
  const bm=returns.map(p=>p.bm).filter((p):p is number=>p!==null);
  const bmvar=bm.length===12?bm.reduce((s,v)=>s+(v-mean(bm))**2,0):0;
  const beta=r.length===12&&bm.length===12&&bmvar>0?r.reduce((s,v,i)=>s+(v-mean(r))*(bm[i]-mean(bm)),0)/bmvar:null;
  let peak=0,drawdown=0;for(const p of points){peak=Math.max(peak,p.nav);drawdown=Math.min(drawdown,p.nav/peak-1);}
  return {asOf:rows.at(-1)?.[0]??null,volatility:vol,sharpe:vol&&excess.length===12?mean(excess)*12/vol:null,beta,maxDrawdown:rows.length?drawdown:null};
}

/** Only a complete, common set of verified trading-day returns enters daily risk. */
export function reconstructedRisk(fund:FundNumber,daily:FundValuePoint[],quotes:DailyQuotes|null):RiskMetrics{
  const empty:RiskMetrics={asOf:null,volatility:null,sharpe:null,beta:null,maxDrawdown:null};
  const verified=new Map(daily.filter(p=>p.fund===fund&&p.coverage==="verified").map(p=>[p.date,p]));
  const benchmark=quotes?.benchmark?.points??[];
  const latest=[...verified.keys()].sort().at(-1);if(!latest)return empty;
  const cutoff=new Date(Date.parse(latest)-365*86400000).toISOString().slice(0,10);
  const expected=benchmark.filter(p=>p.date>=cutoff&&p.date<=latest);
  // Missing days are not bridged as if they were one-day returns.
  if(expected.length<201||expected.some(p=>!verified.has(p.date)))return empty;
  const points=expected.map(p=>({fund:verified.get(p.date)!,benchmark:p,fx:prior(quotes?.eurUsdHistory??[],p.date)}));
  if(points.some(p=>!p.fx))return empty;
  const rf=(from:string,to:string)=>{
    let factor=1;
    for(let ms=Date.parse(from);ms<Date.parse(to);ms+=86400000){const r=prior(quotes?.estrHistory??[],new Date(ms).toISOString().slice(0,10));if(!r)return null;factor*=1+r.close/100/360;}
    return factor-1;
  };
  const returns=points.slice(1).map((p,i)=>{
    const old=points[i];return {r:p.fund.nav/old.fund.nav-1,b:(p.benchmark.close/p.fx!.close)/(old.benchmark.close/old.fx!.close)-1,rf:rf(old.fund.date,p.fund.date)};
  });
  const avg=(a:number[])=>a.reduce((s,v)=>s+v,0)/a.length;
  const r=returns.map(p=>p.r),b=returns.map(p=>p.b),mean=avg(r),bm=avg(b);
  const vol=Math.sqrt(r.reduce((s,v)=>s+(v-mean)**2,0)/(r.length-1)*252);
  const variance=b.reduce((s,v)=>s+(v-bm)**2,0);
  const beta=variance>0?r.reduce((s,v,i)=>s+(v-mean)*(b[i]-bm),0)/variance:null;
  const excess=returns.filter(p=>p.rf!==null).map(p=>p.r-p.rf!);
  const excessVol=excess.length===returns.length?Math.sqrt(excess.reduce((s,v)=>s+(v-avg(excess))**2,0)/(excess.length-1)*252):null;
  let peak=0,drawdown=0;
  for(const p of points){peak=Math.max(peak,p.fund.nav);drawdown=Math.min(drawdown,p.fund.nav/peak-1);}
  return {asOf:latest,volatility:vol,sharpe:excessVol&&excessVol>0?avg(excess)*252/excessVol:null,beta,maxDrawdown:drawdown};
}
