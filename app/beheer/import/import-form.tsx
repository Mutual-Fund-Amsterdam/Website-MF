"use client";
import { useRef, useState } from "react";
import type { ImportSummary } from "@/lib/portal/types";
import type { DifferenceGroup, ImportDifferences } from "@/lib/portal/import-differences";
import styles from "./page.module.css";

type Preview = { id:string; summary:ImportSummary; differences:ImportDifferences };
const number = new Intl.NumberFormat("nl-NL", {maximumFractionDigits:12});
const display = (value:string | number | null) => typeof value === "number" ? number.format(value) : value ?? "—";

function Changes({group}:{group:DifferenceGroup}) {
  const [page,setPage] = useState(0);
  const perPage = 40;
  const pages = Math.ceil(group.changes.length/perPage);
  return <details open={group.changes.length <= 8}>
    <summary>{group.name} · {group.changes.length} {group.changes.length === 1 ? "wijziging" : "wijzigingen"}</summary>
    <div className={styles.tableWrap}><table><thead><tr><th>Onderdeel</th><th>Huidig</th><th>Nieuw</th></tr></thead><tbody>
      {group.changes.slice(page*perPage,(page+1)*perPage).map((r,i)=><tr key={i}><th scope="row">{r.label}</th><td>{display(r.before)}</td><td>{display(r.after)}</td></tr>)}
    </tbody></table></div>
    {pages>1 && <div className={styles.pager}><button disabled={page===0} onClick={()=>setPage(page-1)}>Vorige</button>
      <span>{page+1} / {pages}</span><button disabled={page+1===pages} onClick={()=>setPage(page+1)}>Volgende</button></div>}
  </details>;
}

export default function ImportForm() {
  const [file,setFile] = useState<File | null>(null);
  const [pending,setPending] = useState<Preview | null>(null);
  const [confirmed,setConfirmed] = useState(false);
  const [error,setError] = useState("");
  const [published,setPublished] = useState("");
  const [busy,setBusy] = useState(false);
  const [dragging,setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  function select(candidate?:File) {
    if (inFlight.current) return;
    setPending(null); setConfirmed(false); setPublished(""); setError("");
    if (candidate && (!candidate.name.toLowerCase().endsWith(".xlsx") || candidate.size > 2_000_000)) {
      setError("Kies een .xlsx-bestand van maximaal 2 MB."); setFile(null); return;
    }
    setFile(candidate ?? null);
  }
  async function submit(action:"preview" | "commit") {
    if (inFlight.current || !file || (action === "commit" && (!pending || !confirmed))) return;
    inFlight.current = true; setBusy(true); setError(""); setPublished("");
    const data = new FormData(); data.set("file",file);
    if (action === "preview") { setPending(null); setConfirmed(false); }
    try {
      const response = await fetch("/api/portal/import/"+action, {method:"POST",cache:"no-store",
        ...(action === "preview" ? {body:data} : {headers:{"Content-Type":"application/json"},body:JSON.stringify({id:pending!.id})})});
      const result = await response.json();
      if (!response.ok) {
        if ([403,409,410].includes(response.status)) { setPending(null); setConfirmed(false); }
        setError(result.error ?? "Controleer het bestand en probeer opnieuw.");
      } else if (action === "preview") setPending(result);
      else {
        setPublished(new Date(result.publishedAt).toLocaleString("nl-NL",{dateStyle:"long",timeStyle:"short"}));
        setPending(null); setConfirmed(false); setFile(null);
        if(input.current) input.current.value="";
      }
    } catch { setError("De aanvraag kon niet worden afgerond. Controleer je verbinding en probeer opnieuw."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  const warnings = pending ? [...pending.differences.warnings,...pending.summary.warnings] : [];
  return <section className={styles.panel} aria-busy={busy}>
    {!pending && <label className={styles.drop} data-dragging={dragging} onDragOver={e=>{e.preventDefault(); if(!busy)setDragging(true);}} onDragLeave={()=>setDragging(false)}
      onDrop={e=>{e.preventDefault(); setDragging(false); select(e.dataTransfer.files[0]);}}>
      <strong>{file?.name ?? "Kies of sleep een Excel-bestand"}</strong><span>Excel (.xlsx) · maximaal 2 MB</span>
      <input ref={input} type="file" accept=".xlsx" aria-label="Kies Excel-bestand" disabled={busy} onChange={e=>select(e.target.files?.[0])}/>
    </label>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {published && <p role="status" className={styles.success}>Versie gepubliceerd op {published}. Log opnieuw in om de bijgewerkte fondspagina te openen.</p>}
    {!pending && <button className="button button-primary" disabled={busy || !file} onClick={()=>submit("preview")}>{busy ? "Bestand controleren…" : "Bestand controleren"}</button>}
    {pending && <div className={styles.preview}>
      <h2>Wat verandert?</h2>
      <div className={styles.selectedFile}><span>{file?.name}</span><label>Ander bestand<input type="file" accept=".xlsx" aria-label="Ander bestand" disabled={busy} onChange={e=>select(e.target.files?.[0])}/></label></div>
      {warnings.length>0 && <div className={styles.warnings}><h3>Controlepunten</h3><ul>{warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></div>}
      {pending.differences.groups.length === 0 && <p>Geen verschillen gevonden in de gecontroleerde gegevens.</p>}
      {pending.differences.groups.map(group=><Changes key={pending.id+group.name} group={group}/>)}
      <details><summary>Alle fondstotalen na import</summary><div className={styles.tableWrap}><table><thead><tr>
        {["Fonds","Leden","Posities","Participaties","ING-peildatum"].map(s=><th key={s}>{s}</th>)}</tr></thead><tbody>
        {([1,2,3] as const).map(f=><tr key={f}><th scope="row">{f}</th><td>{pending.summary.members[f]}</td><td>{pending.summary.positions[f]}</td>
        <td>{number.format(pending.summary.participationTotals[f]*100)}%</td><td>{pending.summary.cashDates[f] ?? "Ontbreekt"}</td></tr>)}</tbody></table></div></details>
      <label className={styles.confirm}><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/>Ik heb de verschillen en controlepunten bekeken.</label>
      <p className={styles.muted}>Deze controle is tien minuten geldig.</p>
      <button className="button button-primary" disabled={!confirmed || busy} onClick={()=>submit("commit")}>{busy?"Publiceren…":"Publiceer deze versie"}</button>
    </div>}
  </section>;
}
