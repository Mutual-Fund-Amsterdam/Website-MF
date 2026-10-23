"use client";
import {useState} from "react";
import styles from "./page.module.css";
export default function Composition({stocks,cash,other,total}:{stocks:number;cash:number;other:number;total:number}){
 const [active,setActive]=useState<number|null>(null);
 const segments=[{label:"Aandelen",value:stocks},{label:"Cash",value:cash},...(other>0?[{label:"Overig",value:other}]:[])];
 const pct=(v:number)=>(v/total).toLocaleString("nl-NL",{style:"percent",maximumFractionDigits:1});
 const eur=(v:number)=>v.toLocaleString("nl-NL",{style:"currency",currency:"EUR"});
 const label=(i:number)=>`${segments[i].label}: ${eur(segments[i].value)}, ${pct(segments[i].value)} van de portefeuille`;
 return <div onMouseLeave={()=>setActive(null)}>
  <div className={styles.composition} role="group" aria-label="Portefeuilleverdeling">{segments.map((s,i)=><button type="button" key={s.label} style={{width:`${s.value/total*100}%`}} aria-label={label(i)} onMouseEnter={()=>setActive(i)} onFocus={()=>setActive(i)} onClick={()=>setActive(i)}/>)}</div>
  <div className={styles.legend}>{segments.map((s,i)=><button type="button" key={s.label} onMouseEnter={()=>setActive(i)} onFocus={()=>setActive(i)} onClick={()=>setActive(i)} aria-label={label(i)}><i/>{s.label} <b>{pct(s.value)}</b></button>)}</div>
  {active!==null&&<div role="tooltip" className={styles.compositionTooltip}><b>{segments[active].label}</b> {eur(segments[active].value)} · {pct(segments[active].value)} van de portefeuille</div>}
 </div>;
}
