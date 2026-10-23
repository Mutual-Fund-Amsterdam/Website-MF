import type {EstimatedFundPoint} from "./estimated-history";
import type {DailyQuotes,RiskMetrics} from "./types";
import {prior} from "./performance.ts";
export type ModelRisk=RiskMetrics&{observations:number;from:string|null;indicative:true};
/** One common, dated trading-day sample. Indicative NAVs are never marked verified. */
export function indicativeRisk(history:EstimatedFundPoint[],quotes:DailyQuotes|null):ModelRisk{
 const empty:ModelRisk={asOf:null,sharpe:null,beta:null,volatility:null,maxDrawdown:null,observations:0,from:null,indicative:true};
 const end=history.at(-1)?.date;if(!end||!quotes)return empty;
 const start=new Date(end+"T12:00:00Z");start.setUTCFullYear(start.getUTCFullYear()-1);const cutoff=start.toISOString().slice(0,10);
 const navs=new Map(history.map(p=>[p.date,p.nav]));
 const expected=(quotes.benchmark?.points??[]).filter(p=>p.date>=cutoff&&p.date<=end);
 const rows=expected.map(p=>({date:p.date,nav:navs.get(p.date),index:p.close,fx:prior(quotes.eurUsdHistory??[],p.date)?.close}));
 if(rows.length<201||rows.some(p=>!p.nav||!p.fx)||(Date.parse(rows.at(-1)!.date)-Date.parse(rows[0].date))/86400000<330)return {...empty,asOf:end,observations:Math.max(0,rows.length-1)};
 const rf=(from:string,to:string)=>{let factor=1;for(let t=Date.parse(from);t<Date.parse(to);t+=86400000){const p=prior(quotes.estrHistory??[],new Date(t).toISOString().slice(0,10));if(!p)return null;factor*=1+p.close/100/360;}return factor-1;};
 const observations=rows.slice(1).flatMap((p,i)=>Date.parse(p.date)-Date.parse(rows[i].date)>4*86400000?[]:[{r:p.nav!/rows[i].nav!-1,b:(p.index/p.fx!)/(rows[i].index/rows[i].fx!)-1,rf:rf(rows[i].date,p.date)}]);
 if(observations.length<200)return {...empty,asOf:end,observations:observations.length};
 const avg=(v:number[])=>v.reduce((s,n)=>s+n,0)/v.length;
 const variance=(v:number[])=>v.reduce((s,n)=>s+(n-avg(v))**2,0)/(v.length-1);
 const r=observations.map(p=>p.r),b=observations.map(p=>p.b),bvar=variance(b),vol=Math.sqrt(variance(r)*252);
 const excess=observations.every(p=>p.rf!==null)?observations.map(p=>p.r-p.rf!):[];
 const excessVol=excess.length?Math.sqrt(variance(excess)*252):0;
 let peak=rows[0].nav!,drawdown=0;for(const p of rows){peak=Math.max(peak,p.nav!);drawdown=Math.min(drawdown,p.nav!/peak-1);}
 return {asOf:rows.at(-1)!.date,from:rows[0].date,observations:observations.length,indicative:true,volatility:vol,sharpe:excessVol>0?avg(excess)*252/excessVol:null,beta:bvar>0?r.reduce((s,n,i)=>s+(n-avg(r))*(b[i]-avg(b)),0)/(r.length-1)/bvar:null,maxDrawdown:drawdown};
}
