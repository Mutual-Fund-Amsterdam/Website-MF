"use client";

import type { MemberHistoryPoint } from "@/lib/portal/member-history";
import {memberCalendar} from '@/lib/portal/member-calendar';
import {CartesianGrid,ComposedChart,Line,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import styles from "./page.module.css";

export default function MemberChart({points}: { points: MemberHistoryPoint[]; unavailableReason?: string }) {
  const end=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam'}).format(new Date());
  const shown=memberCalendar(points,end);
  return <section className={styles.panel}>
    <p className="eyebrow">Jouw deelname</p><h2>Jouw verloop.</h2>
    <div className={styles.memberLegend}><span><i/>Waarde</span><span><i/>Netto inleg</span></div>
    <div className={styles.memberChart} data-member-calendar-start="2026-09-16"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={shown} margin={{top:12,right:8,left:0,bottom:0}}>
      <CartesianGrid stroke="rgba(233,229,218,.1)" vertical={false}/>
      <XAxis dataKey="timestamp" type="number" domain={[Date.parse('2026-09-16'),Date.parse(end)]} interval={0} padding={{left:20,right:12}} ticks={shown.filter((_,i)=>i%14===0||i===shown.length-1).map(p=>p.timestamp)} tickFormatter={v=>new Date(v).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})} stroke="#a3a096" tickLine={false} axisLine={false} minTickGap={25} fontSize={11}/>
      <YAxis orientation="right" domain={[(v:number)=>Math.max(0,Math.floor(v*.95/10)*10),(v:number)=>Math.ceil(v*1.05/10)*10]} tickFormatter={v=>`€ ${v.toLocaleString('nl-NL',{maximumFractionDigits:0})}`} stroke="#a3a096" tickLine={false} axisLine={false} width={78} fontSize={11}/>
      <Tooltip filterNull={false} content={({active,label})=>{
        const point=shown.find(p=>p.timestamp===Number(label));if(!active||!point)return null;
        const money=(v:number|null)=>v===null?'Niet beschikbaar':v.toLocaleString('nl-NL',{style:'currency',currency:'EUR'});
        return <div style={{background:'#232320',border:'1px solid rgba(233,229,218,.2)',color:'#e9e5da',padding:10}}><p>{new Date(point.timestamp).toLocaleDateString('nl-NL',{dateStyle:'long'})}</p><p style={{color:'#5893b1'}}>Waarde: {money(point.checkedValue)}</p><p style={{color:'#c6a15b'}}>Netto inleg: {money(point.netInleg)}</p></div>;
      }}/>
      <Line name="Waarde" type="linear" dataKey="checkedValue" connectNulls={false} stroke="#5893b1" strokeWidth={2} dot={{r:3}} isAnimationActive={false}/>
      <Line name="Netto inleg" type="stepAfter" dataKey="netInleg" connectNulls={false} stroke="#c6a15b" strokeWidth={2} dot={false} isAnimationActive={false}/>
    </ComposedChart></ResponsiveContainer></div>
  </section>;
}
