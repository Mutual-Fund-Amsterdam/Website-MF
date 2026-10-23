"use client";
import {CartesianGrid,Line,LineChart,ReferenceLine,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import type {MeetingComparison} from "@/lib/portal/comparison";
import styles from "./page.module.css";

export default function FundChart({comparison,fund}: {comparison:MeetingComparison;fund:number}){
 const rows=comparison.points;
 const pct=(v:number)=>`${(v*100).toLocaleString("nl-NL",{maximumFractionDigits:2})}%`;
 const date=(v:string)=>new Intl.DateTimeFormat("nl-NL",{dateStyle:"medium"}).format(new Date(v+"T12:00:00"));
 return <section className={styles.panel}><p className="eyebrow">Sinds de eerste meeting</p><h2>Fondsrendement.</h2>
  <div className={styles.memberLegend}><span><i/>Fonds {fund}</span><span><i/>S&amp;P 500 (EUR)</span></div>
  {rows.length>0?<div className={styles.fundChart}><ResponsiveContainer width="100%" height="100%"><LineChart data={rows}>
   <CartesianGrid stroke="rgba(233,229,218,.1)" vertical={false}/>
   <XAxis dataKey="date" stroke="#a3a096" minTickGap={45} tickFormatter={date}/>
   <YAxis orientation="right" width={90} stroke="#a3a096" tickFormatter={pct} domain={[(min:number)=>Math.min(-.01,min),(max:number)=>Math.max(.01,max)]}/>
   <ReferenceLine y={0} stroke="#c7c4bc" strokeDasharray="5 5" label={{value:"0%",fill:"#c7c4bc",position:"insideTopLeft"}}/>
   <Tooltip labelFormatter={v=>date(String(v))} contentStyle={{background:"#232320",border:"1px solid #666"}} formatter={(v,n)=>[typeof v==="number"?pct(v):"—",n]}/>
   <Line dataKey="fund" name={`Fonds ${fund}`} stroke="#5893b1" dot={{r:3}} isAnimationActive={false}/>
   <Line dataKey="benchmark" name="S&P 500 (EUR)" stroke="#c6a15b" dot={{r:3}} isAnimationActive={false}/>
  </LineChart></ResponsiveContainer></div>:<p className={styles.muted}>De vergelijking verschijnt zodra voor de startmeeting zowel een fondswaarde als een S&amp;P 500-waarde in EUR beschikbaar is.</p>}
  <p className={styles.chartCaption}>0% op {date(comparison.start)}.{rows.length>0?` Laatste fondsmeting: ${date(rows.at(-1)!.date)}.`:""}{comparison.referenceDate&&comparison.referenceDate!==comparison.start?` Beginstand fonds: laatst bekende administratie van ${date(comparison.referenceDate)}; het fondsverloop is indicatief.`:""}{comparison.benchmarkMissing?" De S&P 500-lijn volgt zodra de bijbehorende slotkoersen beschikbaar zijn.":" Beide lijnen gebruiken dezelfde meetdatums."}{rows.length===1?" Er is nog geen tweede fondsmeting na het startpunt.":""}</p>
 </section>;
}
