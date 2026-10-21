import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/portal/store";
import type { FundNumber } from "@/lib/portal/types";
import LogoutButton from "./logout-button";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mijn fonds", robots: { index: false, follow: false } };

export default async function FundPage({ searchParams }: { searchParams: Promise<{ fonds?: string }> }) {
  const session = await getMemberSession();
  if (!session) redirect("/inloggen");
  const { member, snapshot } = session;
  const selected = Number((await searchParams).fonds) as FundNumber;
  const fund = member.allowedFunds.includes(selected) ? selected : member.fund;
  const positions = snapshot.positions.filter((position) => position.fund === fund);
  const cash = snapshot.cash.find((item) => item.fund === fund);
  const date = (iso: string | null) => iso ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(new Date(`${iso}T12:00:00`)) : "Geen peildatum";
  return <main id="main-content" className={`page-shell ${styles.main}`}>
    <div className="container">
      <div className={styles.top}><div><p className="eyebrow">Ledenomgeving / fonds {fund}</p><h1>Welkom, {member.name.split(" ")[0]}.</h1><p className={styles.muted}>Gegevens bijgewerkt na Excelimport op {date(snapshot.importedAt.slice(0, 10))}.</p></div><LogoutButton /></div>
      {member.allowedFunds.length > 1 && <nav className={styles.switcher} aria-label="Kies fonds">{member.allowedFunds.map((number) => <Link key={number} href={`/mijn-fonds?fonds=${number}`} aria-current={number === fund ? "page" : undefined}>Fonds {number}</Link>)}</nav>}
      <div className={styles.cards}><article><span>Jouw eerste inleg</span><strong>{date(member.firstEntry)}</strong><p>Volgens de ledenadministratie</p></article><article><span>Jouw participatie</span><strong>{member.participation === null ? "—" : `${(member.participation * 100).toLocaleString("nl-NL", { maximumFractionDigits: 3 })}%`}</strong><p>Voorlopig; gecontroleerde fondswaarde ontbreekt</p></article><article><span>Jouw actuele waarde</span><strong>—</strong><p>Verschijnt na aansluiting van koersen en controle van participaties</p></article></div>
      <div className={styles.grid}><section className={styles.panel}><p className="eyebrow">Fonds {fund}</p><h2>Portefeuille.</h2><p className={styles.muted}>Aandelen volgens de laatste Excelimport. Actuele koersen en wegingen volgen na aansluiting van de koersbron.</p><div className={styles.table}><div className={styles.head}><span>Aandeel</span><span>Ticker</span></div>{positions.map((position, index) => <div className={styles.row} key={`${position.ticker}-${index}`}><span>{position.name}</span><span>{position.ticker}</span></div>)}</div></section><section className={styles.panel}><p className="eyebrow">Liquiditeit</p><h2>Cash.</h2><p className={styles.muted}>Laatst handmatig ingevulde standen; valuta worden nog niet omgerekend.</p><dl className={styles.cash}><div><dt>ING (EUR)</dt><dd>{cash?.ingEur == null ? "—" : `€ ${cash.ingEur.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`}</dd></div><div><dt>ING-peildatum</dt><dd>{date(cash?.ingAsOf ?? null)}</dd></div><div><dt>Broker (EUR)</dt><dd>{cash?.brokerEur == null ? "—" : `€ ${cash.brokerEur.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`}</dd></div><div><dt>Broker (USD)</dt><dd>{cash?.brokerUsd == null ? "—" : `$ ${cash.brokerUsd.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`}</dd></div><div><dt>Broker-peildatum</dt><dd>{date(cash?.brokerAsOf ?? null)}</dd></div></dl></section></div>
      <section className={styles.panel}><p className="eyebrow">Historie</p><h2>Fondsontwikkeling.</h2><div className={styles.empty}>De grafiek verschijnt zodra historische fondswaarden en koersdata zijn gecontroleerd.</div></section>
      {member.role.toLowerCase() === "hoofdbestuurder" && <p className={styles.admin}><Link href="/beheer/import">Nieuwe Excelversie importeren →</Link></p>}
    </div>
  </main>;
}
