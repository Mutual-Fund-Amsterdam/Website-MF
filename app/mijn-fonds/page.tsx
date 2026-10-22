import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDailyQuotes, getFundDailyValues, getMemberSession } from "@/lib/portal/store";
import { quoteKey } from "@/lib/portal/marketstack";
import { portfolioView } from "@/lib/portal/portfolio";
import { memberHistory } from "@/lib/portal/member-history";
import type { FundNumber } from "@/lib/portal/types";
import { BenchmarkChart, StockCharts } from "./market-chart";
import MemberChart from "./member-chart";
import LogoutButton from "./logout-button";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mijn fonds", robots: { index: false, follow: false } };

const eur = (value: number) => `€ ${value.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (value: number) => `${(value * 100).toLocaleString("nl-NL", { maximumFractionDigits: 1 })}%`;
const date = (iso: string | null) => iso ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(new Date(`${iso}T12:00:00`)) : "Geen peildatum";
const dateTime = (iso: string | null | undefined) => iso ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Amsterdam" }).format(new Date(iso)) : null;

export default async function FundPage({ searchParams }: { searchParams: Promise<{ fonds?: string; aandeel?: string }> }) {
  const session = await getMemberSession();
  if (!session) redirect("/inloggen");
  const { member, snapshot } = session;
  const query = await searchParams;
  const selected = Number(query.fonds) as FundNumber;
  const fund = member.allowedFunds.includes(selected) ? selected : member.fund;
  const positions = snapshot.positions.filter((position) => position.fund === fund);
  const [quotes, dailyFundValues] = await Promise.all([getDailyQuotes(), getFundDailyValues()]);
  const cash = snapshot.cash.find((item) => item.fund === fund);
  const view = portfolioView(positions, cash, quotes);
  const admin = member.role.toLowerCase() === "hoofdbestuurder";
  const ownFund = fund === member.fund;
  const participationTotal = snapshot.members.filter((item) => item.fund === fund && item.active).reduce((sum, item) => sum + (item.participation ?? 0), 0);
  const participationReconciled = Math.abs(participationTotal - 1) <= 0.005;
  const personalValue = ownFund && member.participation !== null && view.fundValue !== null ? member.participation * view.fundValue : null;
  const excelValue = ownFund ? member.sourceValue : null;
  const personalResult = personalValue !== null && member.deposits !== null && member.withdrawals !== null ? personalValue + member.withdrawals - member.deposits : null;
  const history = ownFund ? memberHistory(member, snapshot, dailyFundValues) : [];
  const risk = snapshot.risk?.[fund];
  const stockShare = view.fundValue && view.stockValue !== null ? view.stockValue / view.fundValue : null;
  const cashShare = view.fundValue && view.cashValue !== null ? view.cashValue / view.fundValue : null;
  const otherShare = view.fundValue && view.otherValue ? view.otherValue / view.fundValue : 0;
  const largestSector = view.sectors[0];
  const largestPosition = view.valued.filter((item) => item.valueEur !== null).sort((a, b) => b.valueEur! - a.valueEur!)[0];
  const stockSeries = view.valued.map(({ position }) => ({ id: quoteKey(position), name: position.name, currency: position.currency, tradingViewSymbol: position.tradingViewSymbol, points: quotes?.history?.[quoteKey(position)] ?? [] }));

  return <main id="main-content" className={`page-shell ${styles.main}`}><div className="container">
    <div className={styles.top}><div><p className="eyebrow">Ledenomgeving / fonds {fund}</p><h1>Welkom, {member.name.split(" ")[0]}.</h1></div><LogoutButton /></div>
    {member.allowedFunds.length > 1 && <nav className={styles.switcher} aria-label="Kies fonds">{member.allowedFunds.map((number) => <Link key={number} href={`/mijn-fonds?fonds=${number}`} aria-current={number === fund ? "page" : undefined}>Fonds {number}</Link>)}</nav>}

    <div className={styles.cards}>
      <article><span>Totale fondswaarde</span><strong>{view.fundValue !== null ? eur(view.fundValue) : "—"}</strong><p>Fonds {fund}</p></article>
      <article><span>Jouw participatie</span><strong>{ownFund && member.participation !== null ? pct(member.participation) : "—"}</strong><p>{ownFund ? `In fonds ${fund}` : `Jouw deelname hoort bij fonds ${member.fund}`}</p></article>
      <article><span>Jouw positie</span><strong>{personalValue !== null ? eur(personalValue) : excelValue !== null ? eur(excelValue) : "—"}</strong><p>{ownFund && member.deposits !== null && member.withdrawals !== null ? `Netto inleg ${eur(member.deposits - member.withdrawals)}${personalResult !== null ? ` · resultaat ${eur(personalResult)}` : ""}${participationReconciled ? "" : " · voorlopig"}` : excelValue !== null ? `Per ${date(snapshot.requestedDate)}` : "Nog geen waarde beschikbaar"}</p></article>
    </div>

    {ownFund && <MemberChart points={history}/>}

    <section className={styles.panel}><div className={styles.sectionHeader}><div><p className="eyebrow">Fonds {fund}</p><h2>Portefeuille.</h2></div><span className={styles.dataTag}>{positions.length} posities</span></div>
      <p className={styles.muted}>Koersen opgehaald: {dateTime(quotes?.fetchedAt) ?? "nog niet beschikbaar"}.</p>
      <div className={styles.tableScroll}><div className={styles.table}><div className={`${styles.row} ${styles.head}`}><span>Aandeel</span><span>Aantal</span><span>Slotkoers</span><span>Waarde</span><span>Fondsgewicht</span></div>
        {view.valued.map(({ position, quote, valueEur }, index) => <div className={styles.row} key={`${quoteKey(position)}-${index}`}><span className={styles.stockName}><Link href={`/mijn-fonds?fonds=${fund}&aandeel=${encodeURIComponent(quoteKey(position))}#koersverloop`}>{position.name}</Link><small>{position.ticker} · {position.exchange}</small></span><span>{position.quantity.toLocaleString("nl-NL")}</span><span>{quote ? `${quote.currency} ${quote.close.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}<small>{quote ? date(quote.date) : "Koers ontbreekt"}</small></span><span>{valueEur !== null ? eur(valueEur) : "—"}</span><span>{valueEur !== null && view.fundValue ? pct(valueEur / view.fundValue) : "—"}</span></div>)}
      </div></div>
      {view.missing.length > 0 && <p className={styles.notice}>Voor {view.missing.length} {view.missing.length === 1 ? "positie" : "posities"} ontbreekt een passende koers of wisselkoers. Daarom zijn fondswegingen en de actuele fondswaarde nog niet volledig berekend.</p>}
    </section>

    <div className={styles.grid}>
      <section className={styles.panel}><p className="eyebrow">Liquiditeit</p><h2>Cash.</h2><strong className={styles.bigNumber}>{view.cashValue !== null ? eur(view.cashValue) : "—"}</strong></section>
      <section className={styles.panel}><p className="eyebrow">Verdeling</p><h2>Cash &amp; aandelen.</h2>{view.fundValue !== null && stockShare !== null && cashShare !== null ? <><div className={styles.composition} role="img" aria-label={`Aandelen ${pct(stockShare)}, cash ${pct(cashShare)}${otherShare ? `, overig ${pct(otherShare)}` : ""}`}><span style={{ width: `${stockShare * 100}%` }}/><span style={{ width: `${cashShare * 100}%` }}/>{otherShare > 0 && <span style={{ width: `${otherShare * 100}%` }}/>}</div><div className={styles.legend}><span><i/>Aandelen <b>{pct(stockShare)}</b></span><span><i/>Cash <b>{pct(cashShare)}</b></span>{otherShare > 0 && <span><i/>Overig <b>{pct(otherShare)}</b></span>}</div><p className={styles.muted}>Fondswaarde indicatief {eur(view.fundValue)}. Overige bezittingen staan apart van cash.</p></> : <div className={styles.compEmpty}>Verdeling verschijnt zodra alle koersen en wisselkoersen beschikbaar zijn.</div>}</section>
    </div>

    <div className={styles.grid}>
      <section className={styles.panel}><p className="eyebrow">Spreiding</p><h2>Sectoren.</h2>{view.sectors.length ? <><div className={styles.sectorList}>{view.sectors.map((sector) => <div key={sector.name}><div><span>{sector.name}</span><b>{view.stockValue ? pct(sector.value / view.stockValue) : "—"}</b></div><progress max={view.stockValue ?? 1} value={sector.value}/></div>)}</div></> : <div className={styles.compEmpty}>Sectorverdeling verschijnt zodra koersen beschikbaar zijn.</div>}</section>
      <section className={styles.panel}><p className="eyebrow">Risico</p><h2>Indicatoren.</h2>{risk?.asOf && <p className={styles.muted}>Per {date(risk.asOf)}</p>}<div className={styles.riskGrid}><div><span>Sharpe 12M</span><strong>{risk?.sharpe?.toLocaleString("nl-NL", { maximumFractionDigits: 2 }) ?? "—"}</strong></div><div><span>Beta t.o.v. S&amp;P 500</span><strong>{risk?.beta?.toLocaleString("nl-NL", { maximumFractionDigits: 2 }) ?? "—"}</strong></div><div><span>Volatiliteit 12M</span><strong>{risk?.volatility !== null && risk?.volatility !== undefined ? pct(risk.volatility) : "—"}</strong></div><div><span>Maximale daling historie</span><strong>{risk?.maxDrawdown !== null && risk?.maxDrawdown !== undefined ? pct(risk.maxDrawdown) : "—"}</strong></div></div><div className={styles.riskSignals}>{cashShare !== null && <p>Cashgewicht: <b>{pct(cashShare)}</b>{cashShare > 0.2 ? " · boven signaleringsgrens 20%" : ""}</p>}{largestSector && view.stockValue !== null && <p>Grootste sector: <b>{largestSector.name} ({pct(largestSector.value / view.stockValue)})</b>{largestSector.value / view.stockValue > 0.35 ? " · boven signaleringsgrens 35%" : ""}</p>}{largestPosition && view.fundValue !== null && <p>Grootste positie: <b>{largestPosition.position.name} ({pct(largestPosition.valueEur! / view.fundValue)})</b></p>}</div></section>
    </div>

    <section className={styles.panel}><p className="eyebrow">Historie</p><h2>Fondsontwikkeling.</h2><div className={styles.empty}>In the making</div></section>
    <div className={styles.chartGrid}><BenchmarkChart points={quotes?.benchmark?.points ?? []}/><StockCharts key={query.aandeel ?? "eerste"} stocks={stockSeries} initialSelected={query.aandeel}/></div>
    {admin && <p className={styles.admin}><Link href="/beheer/import">Nieuwe Excelversie importeren →</Link></p>}
  </div></main>;
}
