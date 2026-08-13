/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { eventImages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Over ons",
  description: "Lees hoe de maandelijkse meetings en drie fondsen van Mutual Fund werken.",
};

const schedule = [
  ["19:00", "Start maandelijkse meeting"],
  ["19:15", "Macro-economische update"],
  ["19:30", "Tell Me Something I Don’t Know"],
  ["20:15", "Pauze"],
  ["20:45", "Fondsbesprekingen"],
  ["22:00", "Afsluitende borrel"],
];

export default function AboutPage() {
  return (
    <main id="main-content" className="page-shell">
      <header className="container page-header wide-header">
        <p className="eyebrow">Over Mutual Fund</p>
        <h1>Van theorie naar overtuiging.</h1>
        <p>
          Mutual Fund is er voor Amsterdamse studenten die verder willen gaan dan
          koersnieuws volgen. We beheren echt kapitaal, bespreken aandelen en zijn
          niet bang om elkaars aannames onderuit te halen.
        </p>
      </header>

      <section className="container editorial-image-block">
        <img src={eventImages.meeting} alt="Studenten tijdens een inhoudelijke bijeenkomst" />
        <p className="image-caption eyebrow">Amsterdam · maandelijkse meeting</p>
      </section>

      <section className="section">
        <div className="container about-grid">
          <div>
            <p className="eyebrow">Iedere tweede woensdag</p>
            <h2>Een avond met ritme.</h2>
            <p>
              Kennis uit de collegezaal wordt toegepast in presentaties van
              professionals, stock-pitches en fondsbesprekingen. Ieder onderdeel heeft
              één doel: leren om een financiële overtuiging scherp te formuleren.
            </p>
          </div>
          <div className="schedule-list">
            {schedule.map(([time, item]) => (
              <div className="schedule-row" key={time}>
                <time>{time}</time>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-elevated">
        <div className="container knowledge-grid">
          <article>
            <p className="eyebrow">01 · Macro</p>
            <h2>Macro-economische update.</h2>
            <p>
              Maandelijks geeft onze macrocommissie een update over de belangrijkste
              macro-economische gebeurtenissen van de afgelopen maand en vertaalt zij
              rente, inflatie en geopolitiek naar gevolgen voor onze portefeuilles.
            </p>
          </article>
          <article>
            <p className="eyebrow">02 · Praktijk</p>
            <h2>Tell Me Something I Don’t Know.</h2>
            <p>
              Tijdens iedere maandelijkse meeting neemt een bedrijf uit ons
              partnernetwerk de leden mee in een relevant onderwerp. Het doel is de
              beleggingsinhoudelijke kennis te verbreden en te verdiepen. Zo vertelde
              IBS Capital Allies recent over waardebeleggen.
            </p>
          </article>
          <article>
            <p className="eyebrow">03 · Kapitaal</p>
            <h2>Fondsbespreking.</h2>
            <p>
              Mutual Fund bestaat uit drie fondsen van ongeveer 25 leden. Ieder lid
              legt €500 in en volgt een specifiek aandeel in de portefeuille. Na
              analyse, vragen en discussie wordt gezamenlijk gestemd over aankopen,
              verkopen en de omvang van posities.
            </p>
          </article>
          <article>
            <p className="eyebrow">04 · Vereniging</p>
            <h2>Buiten de meeting.</h2>
            <p>
              Door het jaar heen staan er workshops en inhousedagen op de agenda.
              Daar komen borrels, andere sociale activiteiten en de jaarlijkse
              ledenreis nog bij.
            </p>
          </article>
        </div>
      </section>

      <section className="section page-cta">
        <div className="container page-cta-inner">
          <div>
            <p className="eyebrow">Ervaar het zelf</p>
            <h2>Sluit aan bij de volgende generatie beleggers.</h2>
          </div>
          <Link className="button button-primary" href="/word-lid">Word lid</Link>
        </div>
      </section>
    </main>
  );
}
