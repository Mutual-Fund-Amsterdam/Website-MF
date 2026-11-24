'use client';
import {useState} from "react";
import ChartPeriod,{calendarPeriods,visibleDays,type CalendarPeriod} from "@/components/portal/chart-period";
import ChartFrame from "@/components/portal/chart-frame";
import {ComposedChart,Line,ReferenceLine,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {comparisonAxis,COMPARISON_FUNDS,type ComparisonDay} from '@/lib/portal/fund-comparison';
import styles from './comparison.module.css';

const colors={1:'#00f000',2:'#ff0808',3:'#009fff'} as const;
const pct=(v:number|null)=>v===null?'—':`${(v*100).toFixed(2)}%`;
const date=(t:number)=>{const d=new Date(t);return `${String(d.getUTCDate()).padStart(2,'0')}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()]}`;};

export default function FundComparisonChart({days,reconstructed,asOf}:{days:ComparisonDay[];reconstructed:boolean;asOf:string}){
 const [period,setPeriod]=useState<CalendarPeriod>("all");
 const visible=visibleDays(days,period);
 const axis=comparisonAxis(asOf);
 const latest=days.at(-1);
 return <ChartFrame title="Cumulatief rendement"><section className={styles.comparison} aria-labelledby="comparison-title">
  <h1 id="comparison-title">Cumulatief rendement</h1>
  <ChartPeriod value={period} onChange={setPeriod} options={calendarPeriods}/>
  <div className={styles.frame}>
  <div className={styles.legend} aria-label="Rendement per fonds">{COMPARISON_FUNDS.map(fund=><span key={fund}><i style={{background:colors[fund]}}/>Fonds {fund}<b aria-hidden="true">|</b>{pct(latest?.[`fund${fund}`]??null)}</span>)}</div>
  <div data-plot className={styles.plot} data-fund-comparison="2026-09-16"><ResponsiveContainer width="100%" height="100%"><ComposedChart accessibilityLayer data={visible} margin={{top:8,right:20,bottom:16,left:12}}>
   <XAxis dataKey="timestamp" type="number" domain={period==="all"?[axis.start,axis.end]:["dataMin","dataMax"]} ticks={period==="all"?axis.ticks:undefined} minTickGap={32} axisLine={false} tickLine={false} stroke="#f3f1ec" tickFormatter={date} fontSize={12}/>
   <YAxis domain={[-.1,1]} ticks={Array.from({length:12},(_,i)=>(i-1)/10)} width={60} stroke="#f3f1ec" axisLine={{stroke:'#969693',strokeWidth:2}} tickLine={false} tickFormatter={v=>`${Math.round(v*100)}%`} fontSize={12} label={{value:'Rendement',angle:-90,position:'insideLeft',fill:'#f3f1ec',fontSize:13}}/>
   <ReferenceLine y={0} stroke="#969693" strokeWidth={2}/>
   <Tooltip filterNull={false} content={({active,label})=>{
    const point=days.find(p=>p.timestamp===Number(label));if(!active||!point)return null;
    return <div className={styles.tooltip}><strong>{new Date(point.timestamp).toLocaleDateString('nl-NL',{dateStyle:'long',timeZone:'UTC'})}</strong>{COMPARISON_FUNDS.map(fund=><p key={fund} style={{color:colors[fund]}}>Fonds {fund}: {pct(point[`fund${fund}`])}</p>)}</div>;
   }}/>
   {COMPARISON_FUNDS.map(fund=><Line key={fund} dataKey={`fund${fund}`} name={`Fonds ${fund}`} type="linear" stroke={colors[fund]} strokeWidth={4} dot={false} activeDot={{r:4}} connectNulls isAnimationActive={false}/>)}
  </ComposedChart></ResponsiveContainer></div></div>
  <p className={styles.caption}>Vanaf 16 september 2026 · bijgewerkt per {new Date(asOf+'T12:00:00Z').toLocaleDateString('nl-NL',{dateStyle:'long',timeZone:'UTC'})}. De lijnen verbinden de beschikbare fondsstanden.{reconstructed?' Historische dagwaarden zijn gereconstrueerd.':''}</p>
 </section></ChartFrame>;
}
