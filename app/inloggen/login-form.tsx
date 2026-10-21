"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "./page.module.css";

export default function LoginForm({ available }: { available: boolean }) {
  const router = useRouter();
  const [fund, setFund] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await fetch("/api/portal/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fund, code }), cache: "no-store" });
      const body = await result.json();
      if (!result.ok) { setError(body.error || "Inloggen lukt nu niet."); return; }
      setCode(""); router.push("/mijn-fonds"); router.refresh();
    } catch { setError("Inloggen lukt nu niet. Probeer het later opnieuw."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit}>
    <p className={styles.cardIntro}>Kies je fonds en vul je persoonlijke code in.</p>
    <div className={styles.field}><label htmlFor="fund">Fonds</label><select id="fund" value={fund} onChange={(event) => setFund(event.target.value)} required disabled={!available}><option value="">Kies je fonds</option><option value="1">Fonds 1</option><option value="2">Fonds 2</option><option value="3">Fonds 3</option></select></div>
    <div className={styles.field}><label htmlFor="member-code">Persoonlijke code</label><input id="member-code" type="password" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="current-password" required maxLength={100} disabled={!available} /></div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <button className="button button-primary" type="submit" disabled={busy || !available}>{busy ? "Even wachten…" : "Inloggen"}</button>
  </form>;
}
