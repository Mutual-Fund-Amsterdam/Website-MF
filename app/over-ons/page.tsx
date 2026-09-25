/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { eventImages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Over ons",
  description: "Ontdek de maandelijkse fondsmeetings, evenementen en drie fondsen van Mutual Fund.",
};

const pillars = [
  {
    number: "01",
    label: "Macro",
    title: "Macro-economische update.",
    text: "Maandelijks geeft onze macrocommissie een update over de belangrijkste macro-economische gebeurtenissen van de afgelopen maand en vertaalt zij rente, inflatie en geopolitiek naar gevolgen voor onze portefeuilles.",
    image: eventImages.macro,
    alt: "Macro-economische update tijdens een bijeenkomst van Mutual Fund",
  },
  {
    number: "02",
    label: "Praktijk",
    title: "Tell Me Something I Don’t Know.",
    text: "Tijdens iedere maandelijkse meeting neemt een bedrijf uit ons partnernetwerk de leden mee in een relevant onderwerp. Zo verbreden en verdiepen we onze beleggingskennis met inzichten die direct uit de praktijk komen.",
    image: eventImages.companyDay,
    alt: "Een partnerpresentatie tijdens een meeting van Mutual Fund",
  },
  {
    number: "03",
    label: "Kapitaal",
    title: "Fondsbespreking.",
    text: "Mutual Fund bestaat uit drie fondsen van ongeveer 25 leden. Ieder lid legt €500 in en volgt een aandeel in de portefeuille. Na analyse, vragen en discussie stemmen we gezamenlijk over iedere positie.",
    image: eventImages.workshop,
    alt: "Leden in gesprek tijdens een fondsbespreking",
  },
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

      <section className="container about-overview" aria-labelledby="about-overview-title">
        <div className="about-overview-main">
          <p className="eyebrow">Maandelijks</p>
          <h2 id="about-overview-title">De fondsmeeting.</h2>
          <p>
            In principe komen we elke maand samen. Hieronder zie je wat er op
            zo’n avond gebeurt.
          </p>
        </div>
        <div className="about-events-note">
          <p className="eyebrow">Buiten de meeting</p>
          <p>
            We organiseren ook workshops, inhousedagen, borrels en de jaarlijkse
            ledenreis.
          </p>
          <Link className="about-events-link" href="/events">
            Bekijk onze evenementen →
          </Link>
        </div>
      </section>

      <section className="about-feature-section">
        <div className="container about-feature-list">
          {pillars.map((pillar, index) => (
            <article
              className={`about-feature${index % 2 === 1 ? " is-reversed" : ""}${index === 0 ? " is-compact-media" : ""}`}
              key={pillar.label}
            >
              <div className="about-feature-media">
                <img src={pillar.image} alt={pillar.alt} />
              </div>
              <div className="about-feature-copy">
                <p className="eyebrow">
                  {pillar.number} · {pillar.label}
                </p>
                <h2>{pillar.title}</h2>
                <p>{pillar.text}</p>
              </div>
            </article>
          ))}
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
