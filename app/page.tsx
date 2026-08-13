/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import BoardGrid from "@/components/BoardGrid";
import ContactForm from "@/components/ContactForm";
import PartnerMarquee from "@/components/PartnerMarquee";
import Stats from "@/components/AnimatedStats";
import { membershipSteps } from "@/lib/content";

const workCards = [
  {
    number: "01",
    title: "Maandelijkse evaluatie",
    text: "We toetsen rendement, verwachtingen en nieuws van iedere positie. Zo blijft elk fonds scherp op risico en overtuiging.",
  },
  {
    number: "02",
    title: "Buy- en sell-pitches",
    text: "Leden bouwen een investment case, verdedigen hun analyse en stemmen gezamenlijk over aan- en verkopen met echt kapitaal.",
  },
  {
    number: "03",
    title: "Drie fondsen, één competitie",
    text: "Drie zelfstandige portefeuilles combineren leren en presteren. Verschillende visies worden direct zichtbaar in de resultaten.",
  },
];

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title" className="sr-only">Mutual Fund</h1>
        <div className="hero-word-wall" aria-hidden="true">
          <svg className="hero-word hero-word-mutual" viewBox="0 0 1000 214">
            <text x="0" y="190" textLength="1000" lengthAdjust="spacingAndGlyphs">
              MUTUAL
            </text>
          </svg>
          <svg className="hero-word hero-word-fund" viewBox="0 0 1000 245">
            <text x="0" y="218" textLength="1000" lengthAdjust="spacingAndGlyphs">
              FUND
            </text>
          </svg>
        </div>
        <div className="bull-stage" aria-hidden="true">
          <div className="bull-shadow" />
          <img className="bull-image" src="/bull.png" alt="" />
        </div>
        <p className="eyebrow hero-label hero-label-left">
          Beleggingsvereniging · Amsterdam · sinds 2010
        </p>
        <p className="eyebrow hero-label hero-label-right">Scroll ↓</p>
      </section>

      <section className="section intro-section">
        <div className="container intro-grid">
          <div className="video-frame">
            <iframe
              src="https://www.youtube.com/embed/5cAZ-VM_MpQ?autoplay=1&mute=1&controls=0&loop=1&playlist=5cAZ-VM_MpQ&playsinline=1&rel=0&disablekb=1"
              title="Mutual Fund — beleggen met passie"
              allow="autoplay; encrypted-media; picture-in-picture"
              loading="lazy"
            />
          </div>
          <div className="intro-copy">
            <p className="eyebrow">De vereniging</p>
            <h2>Beleggen met passie.</h2>
            <p>
              Mutual Fund is dé beleggingsvereniging voor financieel
              georiënteerde studenten in Amsterdam — een educatief platform waar
              analytisch denken en gezamenlijke besluitvorming samenkomen.
            </p>
            <p className="intro-schedule">
              Wij komen bijeen op iedere tweede woensdag van de maand.
            </p>
            <div className="button-row">
              <Link className="button button-primary" href="/word-lid">Word lid</Link>
              <a className="text-link" href="#wat-we-doen">Ontdek Mutual Fund →</a>
            </div>
          </div>
        </div>
        <div className="container">
          <Stats />
        </div>
      </section>

      <section className="section section-elevated" id="wat-we-doen">
        <div className="container">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">De methode</p>
              <h2>Wat we doen.</h2>
            </div>
            <p>
              Theorie wordt overtuiging wanneer je haar durft te verdedigen.
              Mutual Fund brengt analyse, debat en echt kapitaal samen.
            </p>
          </div>
          <div className="work-grid">
            {workCards.map((card) => (
              <article className="work-card" key={card.number}>
                <p className="eyebrow">{card.number}</p>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <BoardGrid />

      <section className="section section-elevated" id="contact">
        <div className="container contact-layout">
          <div className="contact-copy">
            <p className="eyebrow">Direct contact</p>
            <h2>Kom in contact.</h2>
            <p>
              Ben je geïnteresseerd in deelname, een partnership of wil je meer
              weten over Mutual Fund? Stuur het secretariaat een bericht.
            </p>
            <a className="contact-email" href="mailto:secretaris@mutualfund.nl">
              secretaris@mutualfund.nl
            </a>
          </div>
          <ContactForm />
        </div>
      </section>

      <section className="section testimonial-section">
        <div className="container testimonial-wrap">
          <p className="eyebrow">Alumnus aan het woord</p>
          <blockquote>
            “Mijn tijd bij het Mutual Fund heeft mij doen realiseren dat er meer
            komt kijken bij het analyseren van financiële instrumenten dan de
            student wordt aangeleerd tijdens de studie. De stimulerende
            groepsdynamiek heeft mij ertoe aangezet mijn analytische vaardigheden
            te ontwikkelen. Die ervaring heeft significant bijgedragen aan een
            succesvolle stage in investment banking.”
          </blockquote>
          <p className="testimonial-author">
            <strong>Sebastian Bong</strong>
            <span>Société Générale</span>
          </p>
        </div>
      </section>

      <section className="section section-elevated partners-section" id="partners">
        <div className="container section-heading split-heading">
          <div>
            <p className="eyebrow">Ons netwerk</p>
            <h2>Onze partners.</h2>
          </div>
          <p>
            Professionals uit investment banking, private equity, asset
            management en financiële markten brengen praktijkkennis rechtstreeks
            naar onze leden.
          </p>
        </div>
        <PartnerMarquee />
        <div className="container partners-link-row">
          <Link className="text-link" href="/partners">Bekijk alle partners →</Link>
        </div>
      </section>

      <section className="section membership-section">
        <div className="container">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Jouw volgende stap</p>
              <h2>Lid worden.</h2>
            </div>
            <p>
              Voor studenten die financiële markten niet alleen willen volgen,
              maar hun visie willen onderbouwen, bespreken en toepassen.
            </p>
          </div>
          <div className="membership-steps">
            {membershipSteps.map((step) => (
              <article className="membership-step" key={step.number}>
                <p className="step-number">{step.number}</p>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  {step.number === "02" && (
                    <Link className="text-link" href="/word-lid">Naar de Word lid-pagina →</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="membership-cta">
            <Link className="button button-primary" href="/word-lid">Start je sollicitatie</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
