"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AdminView, BookingInput } from "@/lib/portal/admin/model";
import { labels, today } from "@/lib/portal/admin/model";
import { normalizeInput } from "@/lib/portal/admin/fields";
import { membershipRegister, periodYears } from "@/lib/portal/admin/register";
import styles from "./administration.module.css";

const money = (v: number | null | undefined, currency = "EUR") => v == null ? "—" : new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(v);
const number = (v: number | null | undefined) => v == null ? "—" : new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 8 }).format(v);
const venueNames = ["Euronext Amsterdam", "Euronext Paris", "Nasdaq", "New York Stock Exchange", "NYSE American", "Toronto Stock Exchange", "Vienna Stock Exchange"];
const currencies = ["EUR", "USD", "CAD", "GBP", "CHF", "JPY", "AUD", "SEK", "PLN"];
type Review = { id: string; revision: string; bookings: { label: string; actor: string; at: string }[]; funds: { fund: number; members: number; positions: number; units: number; cash: AdminView["cash"][number] }[] };
type ImportReview = { cash: AdminView["cash"]; id: string; active: number; members: number; positions: number; archive: number; replacedBookings: number };
async function api(path: string, body?: unknown) {
  const response = await fetch("/api/portal/admin/" + path, { method: body === undefined ? "GET" : "POST", headers: body instanceof FormData || body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body), cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || "De aanvraag is mislukt."), { status: response.status });
  return result;
}
function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return <div className={styles.scroll} tabIndex={0}>{rows.length ? <table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((v, c) => <td key={c}>{v}</td>)}</tr>)}</tbody></table> : <p>Geen resultaten.</p>}</div>;
}
export default function AdministrationClient({ enrolled: initialEnrolled, verified: initialVerified, local }: { enrolled: boolean; verified: boolean; local: boolean }) {
  const [enrolled, setEnrolled] = useState(initialEnrolled), [verified, setVerified] = useState(initialVerified);
  const [secret, setSecret] = useState(""), [password, setPassword] = useState(""), [otp, setOtp] = useState("");
  const [recovery, setRecovery] = useState<string[]>([]), [credentials, setCredentials] = useState<{ id: string; code: string }[]>([]);
  const [data, setData] = useState<AdminView | null>(null), [tab, setTab] = useState("Invoer"), [segment, setSegment] = useState("Posities");
  const [draft, setDraft] = useState<BookingInput>({ type: "trade", fund: "1", date: today(), side: "Koop", bank: "ING", currency: "EUR", fee: "0", settlementCurrency: "EUR" });
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [fund, setFund] = useState(""), [query, setQuery] = useState(""), [status, setStatus] = useState("Actief"), [year, setYear] = useState("");
  const [confirmation, setConfirmation] = useState<{ input: BookingInput; revision: string; id: string } | null>(null);
  const [publication, setPublication] = useState<Review | null>(null), [importReview, setImportReview] = useState<ImportReview | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const modal = useRef<HTMLDialogElement>(null), lastRevision = useRef("");
  const open = !!confirmation || !!publication || !!importReview || !!credentials.length || !!recovery.length;
  useEffect(() => { if (open) modal.current?.showModal(); else modal.current?.close(); }, [open]);
  async function refresh(notify = false) {
    try {
      const next: AdminView = await api("state");
      if (notify && lastRevision.current && next.revision !== lastRevision.current) setMessage("Een bestuurder heeft de administratie bijgewerkt. Je invoer blijft klaarstaan.");
      lastRevision.current = next.revision; setData(next);
    } catch (e) {
      const error = e as Error & { status?: number };
      if (error.status === 401 || error.status === 428 || error.status === 403) { setVerified(false); setData(null); setRecovery([]); setSecret(""); setOtp(""); setPassword(""); setSecret(""); setCredentials([]); setConfirmation(null); setPublication(null); setImportReview(null); }
      setMessage(error.message);
    }
  }
  useEffect(() => {
    if (!verified || recovery.length) return;
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(true); }, 10000);
    const focus = () => void refresh(true);
    window.addEventListener("focus", focus);
    return () => { clearInterval(timer); window.removeEventListener("focus", focus); };
  }, [verified, recovery.length]);
  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await action(); }
    catch (e) {
      const error = e as Error & { status?: number };
      setMessage(error.message);
      if (error.status === 409) { setConfirmation(null); setPublication(null); setImportReview(null); await refresh(); }
      if ([401, 403, 428].includes(error.status || 0)) { setVerified(false); setData(null); setRecovery([]); setSecret(""); setOtp(""); setPassword(""); setCredentials([]); setConfirmation(null); setPublication(null); setImportReview(null); }
    } finally { setBusy(false); }
  }
  function change(name: string, value: string) {
    setDraft(old => name === "type" ? { type: value, fund: old.fund, date: old.date, side: "Koop", bank: "ING", currency: "EUR", settlementCurrency: "EUR", fee: "0" } : { ...old, [name]: value });
  }
  function field(name: string, label: string, options?: { value: string; label: string }[], required = true, type = "text") {
    return <label className={styles.field} key={name}><span>{label}</span>{options
      ? <select name={name} value={draft[name] || ""} onChange={e => change(name, e.target.value)} required={required}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      : <input name={name} type={type} value={draft[name] || ""} onChange={e => change(name, e.target.value)} required={required} max={type === "date" ? today() : undefined} inputMode={["amount", "quantity", "price", "fee", "nav", "targetNav", "rate"].includes(name) ? "decimal" : undefined} autoComplete="off" />}</label>;
  }
  const choices = (items: string[]) => items.map(value => ({ value, label: value }));
  function newStockFields() {
    return <>{field("ticker", "Ticker")}{field("name", "Naam aandeel")}{field("exchange", "Beurs", [{ value: "", label: "Kies een beurs" }, ...choices(venueNames)])}{field("currency", "Valuta aandeel", choices(currencies))}{field("sector", "Sector")}</>;
  }
  const members = data?.members.filter(m => m.fund === +draft.fund && (m.active || ["withdraw", "exit", "switch"].includes(draft.type))) || [];
  const selected = data?.catalog.find(a => a.ticker === draft.ticker);
  const assetCurrency = draft.newStock === "1" ? draft.currency : selected?.currency;
  const funds = [1, 2, 3].map(f => ({ value: String(f), label: "Fonds " + f }));
  const allRows = data ? membershipRegister(data) : [];
  const years = [...new Set(allRows.flatMap(m => [...periodYears(m.periods)]))].sort().reverse();
  function matchesYear(periods: string[]) {
    const observed = periodYears(periods);
    return !year || (year === "?" ? !observed.size : observed.has(+year));
  }
  const visibleMembers = allRows.filter(m => (!fund || m.fund === +fund) && (status === "Alle leden" || (status === "Archief" ? !m.id : status === "Actief" ? m.active : !!m.id && !m.active)) && matchesYear(m.periods) && (m.name + " " + m.id).toLowerCase().includes(query.toLowerCase()));
  function filters(member = false) {
    return <div className={styles.filters}><input aria-label="Zoeken" type="search" placeholder={member ? "Naam of lid-ID" : "Aandeel of ticker"} value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Fondsfilter" value={fund} onChange={e => setFund(e.target.value)}><option value="">Alle fondsen</option>{funds.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select>{member && <><select aria-label="Ledenstatus" value={status} onChange={e => setStatus(e.target.value)}>{["Actief", "Inactief", "Alle leden", "Archief"].map(s => <option key={s}>{s}</option>)}</select><select aria-label="Jaar" value={year} onChange={e => setYear(e.target.value)}><option value="">Alle jaren</option>{years.map(y => <option key={y}>{y}</option>)}<option value="?">Jaar onbekend</option></select></>}</div>;
  }
  const closeModal = () => { setConfirmation(null); setPublication(null); setImportReview(null); setCredentials([]); setRecovery([]); };
  return <main id="main-content" data-mf-admin className={styles.shell}>
    <header className={styles.header}><button className={styles.brand} onClick={() => setTab("Invoer")}>Mutual Fund</button>
      {verified && !recovery.length && <><nav aria-label="Administratie">{["Invoer", "Leden", "Aandelen"].map(t => <button key={t} aria-current={tab === t ? "page" : undefined} onClick={() => { setTab(t); setFund(""); setQuery(""); }}>{t}</button>)}</nav>
        <button disabled={busy || !data} onClick={() => run(async () => {
          const response = await fetch("/api/portal/admin/export", { cache: "no-store" });
          if (!response.ok) throw new Error((await response.json()).error);
          const url = URL.createObjectURL(await response.blob()), a = document.createElement("a"); a.href = url; a.download = "Mutual-Fund-" + today() + ".xlsx"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
        })}>Excel downloaden</button></>}
      <a href="/mijn-fonds">Mijn fonds</a>
    </header>
    <div className={styles.content}>
      {local && <p className={styles.local}>Fictieve lokale controleomgeving</p>}
      {message && <p className={styles.message} role="status">{message}</p>}
      {!verified && <section className={styles.gate}><h1>Tweestapsverificatie</h1>
        {!enrolled && !secret ? <form onSubmit={e => { e.preventDefault(); void run(async () => { const result = await api("mfa", { action: "setup", password }); setSecret(result.secret); setPassword(""); }); }}>
          <label className={styles.field}>Je persoonlijke lidcode<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button disabled={busy} className={styles.primary}>Authenticator instellen</button>
        </form> : <form onSubmit={e => { e.preventDefault(); void run(async () => { const result = await api("mfa", { action: "verify", code: otp.trim() }); setOtp(""); setSecret(""); setEnrolled(true); setRecovery(result.recoveryCodes || []); setVerified(true); }); }}>
          {secret && <><p>Voeg in je authenticator een account met deze sleutel toe.</p><code className={styles.secret}>{secret}</code></>}
          <label className={styles.field}>Authenticatorcode of herstelcode<input autoComplete="one-time-code" required value={otp} onChange={e => setOtp(e.target.value)} /></label><button className={styles.primary} disabled={busy}>Openen</button>
        </form>}
      </section>}
      {verified && data && !recovery.length && <>
        <div className={styles.heading}><h1>{tab}{tab === "Leden" && <span> · {visibleMembers.length}</span>}</h1><span>{data.updatedAt ? "Bijgewerkt " + new Date(data.updatedAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "Gepubliceerde beginstand"}</span></div>
        {data.baseDigest !== data.publishedDigest && <p className={styles.message}>De gepubliceerde stand is buiten deze werkstand gewijzigd. Vergelijk de bron voordat je verder boekt.</p>}
        {tab === "Invoer" && <div className={styles.grid}>
          <section className={styles.card}><h2>Nieuwe boeking</h2><form onSubmit={e => { e.preventDefault(); setConfirmation({ input: normalizeInput(draft), revision: data.revision, id: crypto.randomUUID() }); }}>
            <div className={styles.fields}>
              {field("type", "Handeling", [...Object.entries(labels).map(([value, label]) => ({ value, label })), { value: "import", label: "Bronbestand inlezen" }, { value: "rebase", label: "Gepubliceerde stand opnieuw inlezen" }])}
              {!["import", "rebase"].includes(draft.type) && <>{field("fund", "Fonds", funds)}{field("date", "Datum", undefined, true, "date")}</>}
              {draft.type === "cash" && <>{field("bank", "Rekening", choices(["ING", "Saxo"]))}{field("currency", "Valuta", choices(draft.bank === "ING" ? ["EUR"] : currencies))}{field("amount", "Absolute cashstand")}</>}
              {draft.type === "trade" && <>{field("side", "Handeling aandeel", choices(["Koop", "Verkoop"]))}
                <label className={styles.field}>Aandeel<select value={draft.newStock === "1" ? "__new" : draft.ticker || ""} required onChange={e => setDraft(d => ({ ...d, ticker: e.target.value === "__new" ? "" : e.target.value, newStock: e.target.value === "__new" ? "1" : "0" }))}><option value="">Kies een aandeel</option><option value="__new">＋ Nieuw aandeel</option>{data.catalog.map(a => <option key={a.ticker} value={a.ticker}>{a.name} · {a.ticker}</option>)}</select></label>
                {draft.newStock === "1" && newStockFields()}
                {field("quantity", "Aantal")}{field("price", "Prijs per aandeel · " + (assetCurrency || "EUR"))}
                <details className={styles.wide}><summary>Kosten en afrekening</summary><div className={styles.fields}>{field("fee", "Kosten · " + (assetCurrency || "EUR"))}{field("settlementCurrency", "Saxo-afrekening", choices(currencies))}{assetCurrency && draft.settlementCurrency !== assetCurrency && field("rate", assetCurrency + " per " + draft.settlementCurrency)}</div></details>
              </>}
              {draft.type === "stock" && newStockFields()}
              {draft.type === "quote" && <>{field("ticker", "Aandeel", [{ value: "", label: "Kies een aandeel" }, ...data.catalog.map(a => ({ value: a.ticker, label: a.name }))])}{field("price", "Slotkoers")}</>}
              {draft.type === "history" && <>{field("ticker", "Ticker")}{field("side", "Handeling aandeel", choices(["Koop", "Verkoop"]))}{field("quantity", "Aantal")}{field("price", "Prijs", undefined, false)}{field("currency", "Valuta", choices(currencies))}{field("broker", "Broker", [{ value: "", label: "Kies een broker" }, ...choices(["Saxo", "IBKR"])])}<p className={styles.wide}>Voor een transactie die al in de beginstand is verwerkt.</p></>}
              {draft.type === "join" && field("name", "Naam lid")}
              {["close", "deposit", "withdraw", "exit", "switch", "code"].includes(draft.type) && field("member", "Lid", [{ value: "", label: "Kies een lid" }, ...members.map(m => ({ value: m.id, label: m.name + " · " + m.id }))])}
              {["join", "deposit", "withdraw", "switch"].includes(draft.type) && field("amount", draft.type === "join" ? "Eerste inleg · EUR (optioneel)" : "Bedrag · EUR", undefined, draft.type !== "join")}
              {(["deposit", "withdraw", "exit", "switch"].includes(draft.type) || draft.type === "join" && draft.amount) && field("nav", "Gecontroleerde boekingsprijs · EUR")}
              {draft.type === "switch" && <>{field("targetFund", "Naar fonds", [{ value: "", label: "Kies een fonds" }, ...funds.filter(f => f.value !== draft.fund)])}{field("targetNav", "Boekingsprijs doelfonds · EUR")}</>}
              {draft.type === "close" && <p className={styles.wide}>Beëindigt het lidmaatschap. Voor uitbetaling kies je Volledig belang uitbetalen.</p>}
              {draft.type === "code" && <p className={styles.wide}>De nieuwe code wordt eenmaal getoond. Zij wordt geldig na publicatie.</p>}
              {draft.type === "import" && <label className={styles.drop}>Kies of sleep een Excel-export, ledenarchief of back-up<input type="file" accept=".xlsx,.json,.mfbackup" onChange={e => setFile(e.target.files?.[0] || null)} /></label>}
            </div>
            {draft.type === "rebase" ? <button type="button" disabled={busy} onClick={() => run(async () => { const form = new FormData(); form.set("source", "published"); form.set("revision", data.revision); setImportReview(await api("import", form)); })}>Stand controleren</button> : draft.type === "import" ? <button type="button" disabled={busy || !file} className={styles.primary} onClick={() => run(async () => { const form = new FormData(); form.set("file", file!); form.set("revision", data.revision); setImportReview(await api("import", form)); })}>Import controleren</button> : <button disabled={busy} className={styles.primary}>Controleren</button>}
          </form></section>
          <div className={styles.stack}>
            <section className={styles.card}><div className={styles.cardhead}><h2>Cashstanden</h2><button onClick={() => setDraft(d => ({ type: "cash", fund: d.fund, date: today(), bank: "ING", currency: "EUR" }))}>Cashstand invoeren</button></div>
              {data.cash.map(c => <div className={styles.fundCash} key={c.fund}><h3>Fonds {c.fund}</h3><div className={styles.pair}><span>ING</span><strong>{money(c.ingEur)}</strong></div><div className={styles.pair}><span>Saxo</span><strong>{money(c.brokerEur)}</strong></div>{!!c.brokerUsd && <div className={styles.pair}><span>Saxo USD</span><strong>{money(c.brokerUsd, "USD")}</strong></div>}{!!c.brokerCad && <div className={styles.pair}><span>Saxo CAD</span><strong>{money(c.brokerCad, "CAD")}</strong></div>}{Object.entries(c.extraBalances || {}).map(([cur, v]) => <div key={cur} className={styles.pair}><span>Saxo {cur}</span><strong>{money(v.amount, cur)}</strong></div>)}<details><summary>Peildatums</summary><p>ING {c.ingAsOf || "Onbekend"} · Saxo {c.brokerAsOf || "Onbekend"}</p></details></div>)}
            </section>
            <section className={styles.card}><div className={styles.cardhead}><h2>Voor publicatie</h2><span>{data.bookings.length} boekingen</span></div>
              {data.bookings.slice(-5).reverse().map(b => <div className={styles.pair} key={b.id}><span>{b.label}</span><span>{b.actor}</span></div>)}
              <button disabled={busy || !data.bookings.length} onClick={() => run(async () => setPublication(await api("review", { revision: data.revision })))}>Publicatie controleren</button>
              <details><summary>Wijzigingshistorie</summary><Table headers={["Tijdstip", "Bestuurder", "Handeling"]} rows={[...data.audit, ...data.bookings].slice().reverse().map(b => [new Date(b.at).toLocaleString("nl-NL"), b.actor, b.label])} /></details>
              <a className={styles.download} href="/api/portal/admin/backup">Versleutelde back-up downloaden</a>
            </section>
          </div>
        </div>}
        {tab === "Leden" && <section className={styles.card}>{filters(true)}<Table headers={["Naam", "Lid-ID", "Fonds", "Status", "Deelbewijzen", "Periode"]} rows={visibleMembers.map(m => [m.name, m.id || "—", m.fund || "—", m.id ? m.active ? "Actief" : "Inactief" : "Archief", number(m.units), m.periods.join(", ") || "Onbekend"])} /></section>}
        {tab === "Aandelen" && <section className={styles.card}><div className={styles.segments}>{["Posities", "Transacties", "Catalogus"].map(s => <button key={s} aria-pressed={segment === s} onClick={() => setSegment(s)}>{s}</button>)}</div>{filters()}
          {segment === "Posities" && <Table headers={["Aandeel", "Ticker", "Fonds", "Aantal", "Valuta"]} rows={data.positions.filter(p => (!fund || p.fund === +fund) && (p.name + p.ticker).toLowerCase().includes(query.toLowerCase())).map(p => [p.name, p.ticker, p.fund, number(p.quantity), p.currency])} />}
          {segment === "Transacties" && <Table headers={["Aandeel", "Datum", "Fonds", "Handeling", "Aantal"]} rows={data.trades.filter(t => (!fund || t.fund === +fund) && t.symbol.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date)).map(t => [t.symbol, t.date, t.fund, t.kind === "Buy" ? "Koop" : "Verkoop", number(Math.abs(t.quantity || 0))])} />}
          {segment === "Catalogus" && <Table headers={["Aandeel", "Ticker", "Beurs", "Valuta", "Sector"]} rows={data.catalog.filter(a => (a.name + a.ticker).toLowerCase().includes(query.toLowerCase())).map(a => [a.name, a.ticker, a.exchange, a.currency, a.sector || "—"])} />}
        </section>}
      </>}
    </div>
    <dialog ref={modal} className={styles.dialog} onCancel={e => { if (busy || recovery.length || credentials.length) e.preventDefault(); else closeModal(); }}>
      {confirmation && <><h2>Boeking controleren</h2><p>{labels[confirmation.input.type]} · Fonds {confirmation.input.fund} · {confirmation.input.date}</p><dl>{Object.entries(confirmation.input).filter(([k, v]) => v && !["type", "fund", "date", "newStock"].includes(k)).map(([k, v]) => <div className={styles.pair} key={k}><dt>{({ ticker: "Aandeel", name: "Naam", side: "Handeling", quantity: "Aantal", price: "Prijs", amount: "Bedrag", nav: "Boekingsprijs", member: "Lid", bank: "Rekening", currency: "Valuta", fee: "Kosten", exchange: "Beurs", sector: "Sector", settlementCurrency: "Cashvaluta", rate: "Wisselkoers", targetFund: "Doelfonds", targetNav: "Boekingsprijs doelfonds", broker: "Broker" } as Record<string, string>)[k] || k}</dt><dd>{v}</dd></div>)}</dl><div className={styles.actions}><button disabled={busy} onClick={closeModal}>Terug</button><button disabled={busy} className={styles.primary} onClick={() => run(async () => { const result = await api("book", confirmation); setData(result.view); lastRevision.current = result.view.revision; setConfirmation(null); setCredentials(result.credentials || []); setMessage(result.duplicate ? "Deze boeking was al opgeslagen. Een eerder getoonde lidcode kun je via Invoer vervangen." : "Boeking opgeslagen voor het hoofdbestuur."); setDraft(d => ({ ...d, amount: "", quantity: "", name: "", newStock: "0" })); })}>Boeken</button></div></>}
      {publication && <><h2>Publicatie controleren</h2><Table headers={["Fonds", "Actieve leden", "Posities", "Deelbewijzen", "ING", "Saxo EUR"]} rows={publication.funds.map(f => [f.fund, f.members, f.positions, number(f.units), money(f.cash.ingEur), money(f.cash.brokerEur)])} /><Table headers={["Boeking", "Bestuurder"]} rows={publication.bookings.map(b => [b.label, b.actor])} /><div className={styles.actions}><button disabled={busy} onClick={closeModal}>Terug</button><button disabled={busy} className={styles.primary} onClick={() => run(async () => { await api("publish", { id: publication.id }); closeModal(); await refresh(); setMessage("De gecontroleerde stand is gepubliceerd voor de leden."); })}>Publiceren</button></div></>}
      {importReview && <><h2>Import controleren</h2><p>{importReview.members} leden · {importReview.active} actief · {importReview.positions} posities · {importReview.archive} archiefvermeldingen</p><Table headers={["Fonds", "ING", "Saxo EUR", "Saxo USD", "Saxo CAD"]} rows={importReview.cash.map(c => [c.fund, money(c.ingEur), money(c.brokerEur), money(c.brokerUsd, "USD"), money(c.brokerCad, "CAD")])} />{importReview.replacedBookings > 0 && <p>Deze import vervangt {importReview.replacedBookings} nog niet gepubliceerde boekingen. De eerdere werkstand blijft in de versleutelde historie bewaard.</p>}<div className={styles.actions}><button disabled={busy} onClick={closeModal}>Terug</button><button disabled={busy} className={styles.primary} onClick={() => run(async () => { const form = new FormData(); form.set("revision", data!.revision); form.set("confirm", importReview.id); const result = await api("import", form); closeModal(); setData(result.view); lastRevision.current = result.view.revision; setMessage("De import staat klaar voor publicatie."); })}>Inlezen</button></div></>}
      {!!credentials.length && <><h2>Nieuwe lidcode</h2><p>Bewaar deze code voor het lid. Zij wordt geldig na publicatie.</p>{credentials.map(c => <p key={c.id}>{c.id}<code className={styles.secret}>{c.code}</code></p>)}<button onClick={closeModal}>Code bewaard</button></>}
      {!!recovery.length && <><h2>Herstelcodes bewaren</h2><p>Elke herstelcode kan één keer worden gebruikt. Bewaar deze codes apart van je authenticator.</p>{recovery.map(c => <code className={styles.secret} key={c}>{c}</code>)}<button onClick={closeModal}>Herstelcodes bewaard</button></>}
      {message && <p role="alert">{message}</p>}
    </dialog>
  </main>;
}
