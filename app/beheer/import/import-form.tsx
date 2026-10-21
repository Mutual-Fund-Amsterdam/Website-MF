"use client";

import { useState, type FormEvent } from "react";
import styles from "./page.module.css";

type Summary = { members: Record<string, number>; positions: Record<string, number>; cashDates: Record<string, string | null>; participationTotals: Record<string, number>; warnings: string[] };

export default function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [secret, setSecret] = useState("");
  const [pending, setPending] = useState<{ id: string; digest: string; summary: Summary } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  async function preview(event: FormEvent) {
    event.preventDefault(); if (!file) return;
    setBusy(true); setError(""); setSuccess(false); setPending(null); setConfirmed(false);
    try {
      const form = new FormData(); form.set("file", file); form.set("secret", secret);
      const response = await fetch("/api/portal/import/preview", { method: "POST", body: form, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) setError(result.error || "Import mislukt."); else setPending(result);
    } catch { setError("Import mislukt. Probeer opnieuw."); }
    finally { setBusy(false); }
  }
  async function publish() {
    if (!pending) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/portal/import/commit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pending.id, secret }), cache: "no-store" });
      const result = await response.json();
      if (!response.ok) setError(result.error || "Publiceren mislukt.");
      else { setSuccess(true); setPending(null); setSecret(""); setFile(null); }
    } catch { setError("Publiceren mislukt. Probeer opnieuw."); }
    finally { setBusy(false); }
  }
  return <div className={styles.panel}>
    <form onSubmit={preview}><label htmlFor="workbook">Excelbestand uit OneDrive</label><input id="workbook" type="file" accept=".xlsx" required onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPending(null); }} /><label htmlFor="import-secret">Beheersleutel</label><input id="import-secret" type="password" value={secret} onChange={(event) => { setSecret(event.target.value); setPending(null); }} required autoComplete="off" /><button className="button button-primary" disabled={busy} type="submit">{busy ? "Even wachten…" : "Bestand controleren"}</button></form>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {success && <p role="status" className={styles.success}>Nieuwe Excelversie gepubliceerd. Leden moeten opnieuw inloggen.</p>}
    {pending && <div className={styles.preview}><h2>Controle vóór publicatie</h2><p>Dit overzicht verloopt na tien minuten.</p><table><thead><tr><th>Fonds</th><th>Leden</th><th>Aandelen</th><th>Participaties</th><th>ING-peildatum</th></tr></thead><tbody>{[1,2,3].map((fund) => <tr key={fund}><td>{fund}</td><td>{pending.summary.members[fund]}</td><td>{pending.summary.positions[fund]}</td><td>{(pending.summary.participationTotals[fund] * 100).toLocaleString("nl-NL", { maximumFractionDigits: 2 })}%</td><td>{pending.summary.cashDates[fund] ?? "Ontbreekt"}</td></tr>)}</tbody></table>{pending.summary.warnings.length > 0 && <div className={styles.warnings}><h3>Controlepunten</h3><ul>{pending.summary.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}<label className={styles.confirm}><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> Ik heb deze tellingen en waarschuwingen gecontroleerd.</label><button className="button button-primary" type="button" disabled={!confirmed || busy} onClick={publish}>Publiceer deze versie</button></div>}
  </div>;
}
