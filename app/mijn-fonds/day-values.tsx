"use client";
import {useState} from 'react';
import styles from './page.module.css';
export type DayValue={date:string;fundValue:number;nav:number;totalUnits:number;value?:number;units?:number;netInleg?:number;indicative:boolean};
const euro=(v:number|undefined)=>v===undefined?'—':v.toLocaleString('nl-NL',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
const date=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('nl-NL',{dateStyle:'long'});
export default function DayValues({days,fund}:{days:DayValue[];fund:number}){
 const [selected,setSelected]=useState(days.at(-1)?.date??'');
 if(!days.length)return null;
 const index=Math.max(0,days.findIndex(d=>d.date===selected)),point=days[index];
 const csv=()=>{
  const fields=['Datum','Fondswaarde EUR','Deelbewijsprijs EUR','Uitstaande deelbewijzen',...(point.value!==undefined?['Eigen waarde EUR','Eigen deelbewijzen','Netto inleg EUR']:[]),'Basis'];
  const number=(n:number|undefined)=>n===undefined?'':String(n).replace('.',',');
  const text=[fields.join(';'),...days.map(d=>[d.date,number(d.fundValue),number(d.nav),number(d.totalUnits),...(point.value!==undefined?[number(d.value),number(d.units),number(d.netInleg)]:[]),d.indicative?'Gereconstrueerd, indicatief':'Berekend uit actuele bezittingen'].join(';'))].join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`fonds-${fund}-dagwaarden.csv`;a.click();URL.revokeObjectURL(url);
 };
 return <section className={styles.panel} aria-label="Dagwaarden">
  <p className="eyebrow">Waarde per kalenderdag</p><h2>Dagwaarden.</h2>
  <div className={styles.dayControls}>
   <button type="button" disabled={index===0} onClick={()=>setSelected(days[index-1].date)} aria-label="Vorige dag">←</button>
   <label>Peildatum <select value={point.date} onChange={e=>setSelected(e.target.value)}>{[...days].reverse().map(d=><option key={d.date} value={d.date}>{date(d.date)}</option>)}</select></label>
   <button type="button" disabled={index===days.length-1} onClick={()=>setSelected(days[index+1].date)} aria-label="Volgende dag">→</button>
   <button type="button" onClick={csv}>Dagwaarden downloaden</button>
  </div>
  <p className={styles.muted}>{date(point.date)} · {point.indicative?'Gereconstrueerde tussenstand, indicatief':'Berekend uit de geregistreerde bezittingen en cashstanden'}</p>
  <div className={styles.daySummary}><div><span>Fondswaarde</span><strong>{euro(point.fundValue)}</strong></div>{point.value!==undefined&&<div><span>Jouw positie</span><strong>{euro(point.value)}</strong></div>}<div><span>Prijs per deelbewijs</span><strong>{euro(point.nav)}</strong></div></div>
  <p className={styles.chartCaption}>Elke kalenderdag vanaf 16 september 2026. Op dagen zonder nieuwe beurskoers gebruiken we de vorige beschikbare slotkoers. Historische tussenstanden zijn gereconstrueerd; ze zijn geen afzonderlijk gecontroleerde brokerafsluitingen. Cash volgt de geregistreerde standen en transacties.</p>
  <details className={styles.dayTable}><summary>Alle {days.length} dagwaarden bekijken</summary><div className={styles.tableScroll}><table><thead><tr><th>Datum</th><th>Fondswaarde</th>{point.value!==undefined&&<th>Jouw positie</th>}<th>Basis</th></tr></thead><tbody>{[...days].reverse().map(d=><tr key={d.date}><td>{new Date(d.date+'T12:00:00').toLocaleDateString('nl-NL')}</td><td>{euro(d.fundValue)}</td>{point.value!==undefined&&<td>{euro(d.value)}</td>}<td>{d.indicative?'Gereconstrueerd':'Actuele bezittingen'}</td></tr>)}</tbody></table></div></details>
 </section>;
}
