"use client";
import {useState,useId,type CSSProperties} from "react";
import * as Popover from "@radix-ui/react-popover";
import styles from "./page.module.css";
export default function Composition({stocks,cash,other,total}:{stocks:number;cash:number;other:number;total:number}){
 const [active,setActive]=useState<string|null>(null),prefix=useId();
 const segments=[{label:"Aandelen",value:stocks},{label:"Cash",value:cash},...(other>0?[{label:"Overig",value:other}]:[])];
 const pct=(v:number)=>total>0?(v/total).toLocaleString("nl-NL",{style:"percent",maximumFractionDigits:1}):"—";
 const eur=(v:number)=>v.toLocaleString("nl-NL",{style:"currency",currency:"EUR"});
 function item(i:number,legend:boolean){
  const s=segments[i],id=`${prefix}-${legend?"legend":"bar"}-${i}`,label=`${s.label}: ${eur(s.value)}, ${pct(s.value)} van de portefeuille`;
  return <Popover.Root key={id} open={active===id} onOpenChange={open=>setActive(open?id:null)}><Popover.Trigger asChild><button type="button" style={legend?undefined:{width:`${total>0?s.value/total*100:0}%`} as CSSProperties} aria-label={label} aria-describedby={active===id?`${id}-tip`:undefined} onPointerEnter={e=>{if(e.pointerType==="mouse")setActive(id);}} onPointerLeave={e=>{if(e.pointerType==="mouse")setActive(null);}} onFocus={e=>{if(e.currentTarget.matches(":focus-visible"))setActive(id);}} onBlur={()=>setActive(null)}>{legend&&<><i/>{s.label} <b>{pct(s.value)}</b></>}</button></Popover.Trigger><Popover.Portal><Popover.Content id={`${id}-tip`} role="tooltip" side="top" sideOffset={9} collisionPadding={12} className={styles.compositionTooltip} onOpenAutoFocus={e=>e.preventDefault()} onCloseAutoFocus={e=>e.preventDefault()}><b>{s.label}</b> {eur(s.value)} · {pct(s.value)}<Popover.Arrow fill="var(--paper, #252522)"/></Popover.Content></Popover.Portal></Popover.Root>;
 }
 return <div><div className={styles.composition} role="group" aria-label="Portefeuilleverdeling">{segments.map((_,i)=>item(i,false))}</div><div className={styles.legend}>{segments.map((_,i)=>item(i,true))}</div></div>;
}
