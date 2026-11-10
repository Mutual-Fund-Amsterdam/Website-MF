"use client";

import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MemberHistoryPoint } from "@/lib/portal/member-history";
import {FUND_RETURN_BASELINE} from "@/lib/portal/comparison";
import styles from "./page.module.css";

const euro = (value: number) => `€ ${value.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;

export default function MemberChart({ points,unavailableReason }: { points: MemberHistoryPoint[];unavailableReason?:string }) {
  const available=points.filter(p=>p.date>=FUND_RETURN_BASELINE);
  const knownStart=available.find(p=>!p.indicative)?.date;
  const shown=available.filter(p=>knownStart&&p.date>=knownStart).map(p=>({...p,timestamp:Date.parse(p.date),checkedValue:p.indicative?null:p.value}));
  const firstChecked=shown.find(p=>p.checkedValue!==null)?.date;
  if (!shown.length) return <section className={styles.panel}><p className="eyebrow">Jouw deelname</p><h2>Jouw verloop.</h2><p className={styles.chartCaption}>{unavailableReason??'Er zijn nog geen financieel aangesloten dagwaarden om een betrouwbaar waardeverloop te tekenen.'}</p><p className={styles.muted}>De historische reeks is nog niet volledig aangesloten. Er wordt geen vlakke of fictieve waardelijn getekend.</p></section>;
  return <section className={styles.panel}>
    <p className="eyebrow">Jouw deelname</p><h2>Jouw verloop.</h2>
    <p className={styles.chartCaption}>Getoonde boekstanden vanaf {new Date((firstChecked??FUND_RETURN_BASELINE)+'T12:00:00').toLocaleDateString('nl-NL',{dateStyle:'long'})}.{available.some(p=>p.indicative)?' Eerdere dagen vanaf 16 september zijn nog niet financieel aangesloten.':''}</p>
    <div className={styles.memberLegend}><span><i/>Waarde</span><span><i/>Netto inleg</span></div>
    <div className={styles.memberChart}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={shown} margin={{top:12,right:8,left:0,bottom:0}}>
      <CartesianGrid stroke="rgba(233,229,218,.1)" vertical={false}/>
      <XAxis dataKey="timestamp" type="number" domain={["dataMin","dataMax"]} tickFormatter={v=>new Date(v).toLocaleDateString("nl-NL",{day:"numeric",month:"short"})} stroke="#a3a096" tickLine={false} axisLine={false} minTickGap={25} fontSize={11}/>
      <YAxis orientation="right" domain={[(v:number)=>Math.max(0,Math.floor(v*.95/10)*10),(v:number)=>Math.ceil(v*1.05/10)*10]} tickFormatter={euro} stroke="#a3a096" tickLine={false} axisLine={false} width={78} fontSize={11}/>
      <Tooltip contentStyle={{background:"#232320",border:"1px solid rgba(233,229,218,.2)",color:"#e9e5da"}} formatter={(value,name)=>typeof value==="number"?[value.toLocaleString("nl-NL",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2}),name==="netInleg"?"Netto inleg":"Waarde"]:["",""]} labelFormatter={v=>new Date(Number(v)).toLocaleDateString("nl-NL",{dateStyle:"long"})}/>
      <Line type="linear" dataKey="checkedValue" connectNulls={false} stroke="#5893b1" strokeWidth={2} dot={shown.length<=7?{r:3}:false} isAnimationActive={false}/>
      <Line type="stepAfter" dataKey="netInleg" stroke="#c6a15b" strokeWidth={2} dot={false} isAnimationActive={false}/>
    </ComposedChart></ResponsiveContainer></div>
  </section>;
}
