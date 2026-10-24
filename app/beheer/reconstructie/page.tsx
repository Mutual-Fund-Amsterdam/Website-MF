import BoardNav from "../board-nav";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getMemberSession,getReconstructionDays} from "@/lib/portal/store";
import {auditLedger,historicalCandidates,linkedMemberEvents} from "@/lib/portal/ledger";
import styles from "../import/page.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Historische reconstructie",robots:{index:false,follow:false}};
const money=(v:number|null)=>v===null?"—":v.toLocaleString("nl-NL",{style:"currency",currency:"EUR"});
export default async function ReconstructionPage(){
 const session=await getMemberSession();if(!session)redirect("/inloggen");
 if(session.member.role.toLowerCase()!=="hoofdbestuurder")redirect("/mijn-fonds");
 const {snapshot}=session,audit=auditLedger(snapshot);
 const rows=audit?await Promise.all(([1,2,3] as const).map(f=>getReconstructionDays(snapshot,f))):[];
 const known=historicalCandidates(snapshot);
 const unknown=[...new Set((snapshot.ledger?.broker??[]).filter(e=>["Buy","Sell","Ankerpositie"].includes(e.kind)&&e.symbol&&!known.some(p=>p.ticker===e.symbol&&p.currency===e.currency)).map(e=>e.symbol))];
 return <main id="main-content" className={`page-shell ${styles.main}`}><div className="container"><p className="eyebrow">Bestuur / ledenomgeving</p><h1>Historische reconstructie.</h1>
 <BoardNav active="reconstructie"/>
 {!audit?<p className={styles.notice}>Importeer het masterbestand met Bankmutaties en Brokertransacties om de broncontroles te bekijken.</p>:<>
 <section className={styles.panel}><h2>Eerst beoordelen</h2><p>De bestaande financiële invoer is behouden. Een afwijking tussen IBKR en de master kan door Saxo worden verklaard. Recente fondswaarden zijn onvolledig zolang die transacties ontbreken.</p><p>{audit.bankRows} ING-mutaties · {audit.brokerRows} brokerbronregels · {audit.membersChecked} ledencontroles · {audit.matchedTransfers} voorgestelde transferkoppelingen.</p></section>
 <section className={styles.preview}><h2>ING-controle</h2><table><thead><tr><th>Fonds</th><th>Periode</th><th>Beginsaldo</th><th>Eindsaldo</th><th>Verschil</th></tr></thead><tbody>{audit.bank.map(b=><tr key={b.fund}><td>{b.fund}</td><td>{b.from} – {b.to}</td><td>{money(b.opening)}</td><td>{money(b.closing)}</td><td>{b.differenceCents===null?"Onbekend":money(b.differenceCents/100)}</td></tr>)}</tbody></table></section>
 <section className={styles.preview}><h2>Standen ter beoordeling</h2><table><thead><tr><th>Fonds</th><th>Controle</th><th>Onderdeel</th><th>Bron</th><th>Vergelijkingsstand</th><th>Toelichting</th></tr></thead><tbody>{audit.issues.map((i,n)=><tr key={n}><td>{i.fund}</td><td>{i.category}</td><td>{i.item}</td><td>{i.source?.toLocaleString("nl-NL")??"—"}</td><td>{i.master?.toLocaleString("nl-NL")??"—"}</td><td>{i.detail}</td></tr>)}</tbody></table></section>
 <details className={styles.preview}><summary>Ledenbetalingen koppelen</summary><p>Behoud de administratiedatum. Vul bij de bankbetaling het Lid-ID in en zet bij herhaalde gelijke bedragen onderstaande koppeling in Tegenboeking-ID. Controleer het bedrag en zet Beoordeling op Goedgekeurd.</p><table><thead><tr><th>Fonds</th><th>Lid-ID</th><th>Administratiedatum</th><th>Bedrag</th><th>Koppeling</th></tr></thead><tbody>{linkedMemberEvents(snapshot).map(e=><tr key={e.link}><td>{e.fund}</td><td>{e.memberId}</td><td>{e.date}</td><td>{money(e.amount)}</td><td style={{overflowWrap:"anywhere"}}>{e.link}</td></tr>)}</tbody></table></details>
 <section className={styles.panel}><h2>Dagreeks en ontbrekende gegevens</h2>{rows.map((days,index)=>{const counts=new Map<string,number>();for(const d of days)for(const r of d.reasons)counts.set(r,(counts.get(r)??0)+1);return <div key={index}><h3>Fonds {index+1}</h3><p>{days.length} kalenderdagen · {days.filter(d=>d.status==="verified").length} gecontroleerd · {days.filter(d=>d.status!=="verified").length} nog te beoordelen of onvolledig.</p><ul>{[...counts].map(([r,n])=><li key={r}>{r.replaceAll("_"," ")}: {n} dagen</li>)}</ul><Link href={`/api/portal/reconstruction?fonds=${index+1}`}>Controle-dagreeks downloaden (CSV)</Link></div>;})}</section>
 <section className={styles.panel}><h2>Koersgegevens</h2><p>{known.length} unieke beursinstrumenten zijn gekoppeld. De dagelijkse taak om 05:15 UTC haalt uitsluitend de laatste slotkoersen op: maximaal één credit per uniek huidig aandeel plus één voor de index. Historische downloads zijn uitgeschakeld; bestaande grafiekhistorie blijft bewaard.</p><p>Dit overzicht doet geen koersaanvragen. Nog te koppelen verkochte tickers: {unknown.join(", ")||"geen"}.</p></section>
 </>}
 <p><a href="/mijn-fonds">← Terug naar mijn fonds</a></p></div></main>;
}
