import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Inloggen",
  description: "Ledenomgeving van Mutual Fund Amsterdam.",
  robots: { index: false, follow: false },
};

const metrics = [
  { label: "Jouw positie", detail: "Persoonlijke waarde en rendement" },
  { label: "Fondswaarde", detail: "Aandelen en cash samen" },
  { label: "Cash", detail: "ING en broker per peildatum" },
];

export default function LoginPage() {
  return (
    <main id="main-content" className="page-shell">
      <section className={`container ${styles.intro}`}>
        <div className={styles.copy}>
          <p className="eyebrow">Ledenomgeving</p>
          <h1>Jouw fonds.<br /><em>In beeld.</em></h1>
          <p>
            Eén plek voor de stand van je fonds, de aandelen in de portefeuille
            en straks je eigen participaties. Hieronder zie je hoe het
            ledenoverzicht eruit gaat zien.
          </p>
          <span className={styles.status}>Eerste opzet · persoonlijke gegevens nog niet beschikbaar</span>
        </div>

        <div className={styles.loginCard} aria-labelledby="login-heading">
          <span className={styles.cardNumber}>01 / TOEGANG</span>
          <h2 id="login-heading">Inloggen.</h2>
          <p className={styles.cardIntro}>
            De beveiligde inlog wordt aangesloten op de gecontroleerde ledenadministratie.
            Tot die tijd accepteren we hier geen persoonlijke codes.
          </p>
          <div className={styles.field}>
            <label htmlFor="fund">Fonds</label>
            <select id="fund" disabled defaultValue="">
              <option value="">Kies je fonds</option>
              <option>Fonds 1</option>
              <option>Fonds 2</option>
              <option>Fonds 3</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="member-code">Persoonlijke code</label>
            <input id="member-code" type="password" placeholder="Nog niet beschikbaar" disabled />
          </div>
          <button className="button button-primary" type="button" disabled>
            Inloggen
          </button>
          <p className={styles.help}>Vragen over je toegang? <a href="mailto:secretaris@mutualfund.nl">Neem contact op met het bestuur →</a></p>
        </div>
      </section>

      <section className={styles.preview} aria-label="Voorbeeld van de ledenpagina">
        <div className="container">
          <div className={styles.previewHead}>
            <div>
              <p className="eyebrow">Voorbeeld / fonds 1</p>
              <h2>Het overzicht.</h2>
            </div>
            <span className={styles.example}>VOORBEELD · GEEN ACTUELE WAARDES</span>
          </div>
          <div className={styles.metrics}>
            {metrics.map((metric) => (
              <article className={styles.metric} key={metric.label}>
                <span>{metric.label}</span>
                <strong>—</strong>
                <p>{metric.detail}</p>
              </article>
            ))}
          </div>
          <div className={styles.panels}>
            <article className={styles.chart}>
              <div className={styles.panelHead}>
                <div>
                  <p className="eyebrow">Rendement</p>
                  <h3>Fondsontwikkeling.</h3>
                </div>
                <span>01 / GRAFIEK</span>
              </div>
              <div className={styles.chartEmpty}>
                <span className={styles.chartMark} aria-hidden="true">↗</span>
                <p>De rendementsgrafiek verschijnt zodra de historische fondsstanden zijn gecontroleerd.</p>
              </div>
            </article>
            <article className={styles.positions}>
              <div className={styles.panelHead}>
                <div>
                  <p className="eyebrow">Portefeuille</p>
                  <h3>Posities.</h3>
                </div>
                <span>02 / AANDELEN</span>
              </div>
              <p>Hier verschijnen de aandelen van jouw fonds, de wegingen en de laatst beschikbare koersen.</p>
              <div className={styles.tableHeader}><span>AANDEEL</span><span>WEGING</span></div>
              <div className={styles.tableRow}><span>Koersdata wordt gekoppeld</span><span>—</span></div>
              <div className={styles.tableRow}><span>Cashpositie</span><span>—</span></div>
            </article>
          </div>
          <p className={styles.disclaimer}>
            Dit is een ontwerpvoorbeeld. Persoonlijke waarde, koersen en cijfers zijn nog niet gepubliceerd.
          </p>
        </div>
      </section>
    </main>
  );
}
