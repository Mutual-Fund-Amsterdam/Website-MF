"use client";
import {useState} from "react";
import {CartesianGrid,ComposedChart,Line,ReferenceLine,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {chartPeriod,type FundChartPeriod,type MeetingComparison} from "@/lib/portal/comparison";
import styles from "./page.module.css";

export default function FundChart({comparisons,fund}: {comparisons:{year:MeetingComparison;historical:MeetingComparison};fund:number}){
 const [mode,setMode]=useState<"year"|"historical">("year");
 const comparison=comparisons[mode];
 const [period,setPeriod]=useState<FundChartPeriod>("all");
 const rows=mode==="year"?comparison.points:chartPeriod(comparison.points,period,comparison.start);
 const chartRows=rows.map(p=>({...p,timestamp:Date.parse(p.date)}));
 const pct=(v:number)=>`${(v*100).toLocaleString("nl-NL",{maximumFractionDigits:2})}%`;
 const date=(v:string)=>new Intl.DateTimeFormat("nl-NL",{dateStyle:"medium"}).format(new Date(v+"T12:00:00"));
 return <section className={styles.panel}><p className="eyebrow">Historische ontwikkeling</p><h2>Fondsrendement.</h2>
  <p className={styles.chartCaption}>Baseline (0%): {mode==="year"?"eerste meeting, ":"historische start, "}{new Intl.DateTimeFormat("nl-NL",{dateStyle:"long"}).format(new Date(comparison.start+"T12:00:00"))}.</p>
  <div className={styles.historyPeriods} role="group" aria-label="Vergelijking">{([["year","Dit fondsjaar"],["historical","Historisch tegenover S&P 500"]] as const).map(([id,label])=><button type="button" key={id} aria-pressed={mode===id} onClick={()=>setMode(id)}>{label}</button>)}</div>
  {mode==="historical"&&<div className={styles.historyPeriods} role="group" aria-label="Periode fondsgrafiek">{([["6m","6 maanden"],["1y","1 jaar"],["2y","2 jaar"],["all","Alles"]] as const).map(([id,label])=><button key={id} type="button" aria-pressed={id===period} onClick={()=>setPeriod(id)}>{label}</button>)}</div>}
  <div className={styles.memberLegend}><span><i/>Fonds {fund}</span><span><i/>S&amp;P 500 (EUR)</span></div>
  {rows.length>0?<div className={styles.fundChart}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartRows}>
   <CartesianGrid stroke="rgba(233,229,218,.1)" vertical={false}/>
   <XAxis dataKey="timestamp" type="number" domain={["dataMin","dataMax"]} stroke="#a3a096" minTickGap={45} tickFormatter={v=>date(new Date(v).toISOString().slice(0,10))}/>
   <YAxis orientation="right" width={90} stroke="#a3a096" tickFormatter={pct} domain={[(min:number)=>Math.min(-.01,min),(max:number)=>Math.max(.01,max)]}/>
   <ReferenceLine y={0} stroke="#c7c4bc" strokeDasharray="5 5" label={{value:"0%",fill:"#c7c4bc",position:"insideTopLeft"}}/>
   <ReferenceLine x={Date.parse(comparison.start)} stroke="#c7c4bc" strokeDasharray="3 5"/>
   <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const p=payload[0].payload as MeetingComparison['points'][number];return <div className={styles.historyTooltip}><b>{date(p.date)}</b><p>Fonds {fund}: {pct(p.fund)}</p><p>S&amp;P 500: {p.benchmark===null?"—":pct(p.benchmark)}</p></div>;}}/>
   <Line type="linear" dataKey="fund" name={`Fonds ${fund}`} stroke="#5893b1" dot={false} isAnimationActive={false} connectNulls/>
   <Line type="linear" dataKey="benchmark" name="S&P 500 (EUR)" stroke="#c6a15b" dot={false} isAnimationActive={false} connectNulls/>
  </ComposedChart></ResponsiveContainer></div>:<p className={styles.muted}>Voor deze periode zijn nog geen fondswaarden beschikbaar.</p>}
  <p className={styles.chartCaption}>{comparison.dailyFrom?"Dagverloop indicatief. ":""}{rows.length>0?`Peildatum: ${date(rows.at(-1)!.date)}.`:""}</p>
 </section>;
}
