import type { Metadata } from "next";
import Link from "next/link";
import { configured, getSnapshot } from "@/lib/portal/store";
import LoginForm from "./login-form";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inloggen", description: "Ledenomgeving van Mutual Fund Amsterdam.", robots: { index: false, follow: false } };

export default async function LoginPage() {
  let ready = false;
  if (configured()) {
    try { ready = Boolean(await getSnapshot()); } catch { /* Show setup state. */ }
  }
  return (
    <main id="main-content" className="page-shell">
      <section className={`container ${styles.intro}`}>
        <div className={styles.copy}>
          <p className="eyebrow">Ledenomgeving</p>
          <h1>Jouw fonds.<br /><em>In beeld.</em></h1>
          <p>Bekijk de portefeuille van je fonds en de gegevens die bij jouw lidmaatschap horen.</p>
          <span className={styles.status}>{ready ? "Alleen voor leden" : "De ledenomgeving wordt ingericht"}</span>
        </div>
        <div className={styles.loginCard}>
          <span className={styles.cardNumber}>01 / TOEGANG</span>
          <h2>Inloggen.</h2>
          {ready ? <LoginForm /> : <p className={styles.cardIntro}>De beveiligde ledenomgeving is nog niet geactiveerd. Je persoonlijke code kun je hier gebruiken zodra het bestuur de eerste gecontroleerde Excelversie heeft geïmporteerd.</p>}
          <p className={styles.help}>Vragen over je toegang? <a href="mailto:secretaris@mutualfund.nl">Neem contact op met het bestuur →</a></p>
        </div>
      </section>
      {!ready && <section className={styles.preview}><div className="container"><p className="eyebrow">Voorbeeld</p><h2>Het overzicht.</h2><div className={styles.metrics}><article className={styles.metric}><span>Jouw positie</span><strong>—</strong><p>Na controle van de ledenadministratie.</p></article><article className={styles.metric}><span>Fondswaarde</span><strong>—</strong><p>Na aansluiting van de koersbron.</p></article><article className={styles.metric}><span>Cash</span><strong>—</strong><p>Volgens de laatste Excelimport.</p></article></div><p className={styles.disclaimer}>Het bestuur kan de Excelimport <Link href="/beheer/import">hier voorbereiden</Link>.</p></div></section>}
    </main>
  );
}
