/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import AexBackdrop from "@/components/AexBackdrop";
import BoardGrid from "@/components/BoardGrid";
import ContactForm from "@/components/ContactForm";
import PartnerMarquee from "@/components/PartnerMarquee";
import Stats from "@/components/AnimatedStats";
import { eventImages, membershipSteps } from "@/lib/content";

const workCards = [
  {
    number: "01",
    title: "Iedere positie op tafel",
    text: "Tijdens de maandelijkse meeting lopen we de portefeuille langs: wat is er veranderd, klopt de oorspronkelijke thesis nog en moeten we bijkopen, afbouwen of uitstappen?",
  },
  {
    number: "02",
    title: "Pitchen, vragen, stemmen",
    text: "Een lid presenteert de waardering, katalysatoren en risico’s. Daarna volgen kritische vragen en beslist het fonds met echt kapitaal.",
  },
  {
    number: "03",
    title: "Drie eigen portefeuilles",
    text: "Elk fonds maakt zijn eigen keuzes en houdt een eigen rendement bij. Zo zie je direct welke thesis standhoudt — en welk fonds bovenaan eindigt.",
  },
];

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <AexBackdrop />
        <h1
          id="hero-title"
          className="hero-statement"
          aria-label="De beleggingsvereniging voor de financiële leiders van morgen."
        >
          <span className="hero-statement-part hero-statement-leading" aria-hidden="true">
            <span>De</span>
            <span>beleggings-</span>
            <span>vereniging</span>
          </span>
          <span className="hero-statement-part hero-statement-trailing" aria-hidden="true">
            <span>voor de</span>
            <span>financiële</span>
            <span>leiders van</span>
            <span className="hero-statement-accent">morgen.</span>
          </span>
        </h1>
        <figure className="bull-stage" aria-hidden="true">
          <div className="bull-shadow" />
          <img
            className="bull-image"
            src="/bull.png?v=charging-bull-20260813"
            alt=""
            width="1536"
            height="1024"
            fetchPriority="high"
            decoding="sync"
          />
        </figure>
        <p className="eyebrow hero-label hero-label-left">Amsterdam · sinds 2010</p>
        <p className="eyebrow hero-label hero-label-right">Scroll ↓</p>
      </section>

      <section className="section intro-section">
        <div className="container intro-grid">
          <div className="video-frame">
            <iframe
              src="https://www.youtube-nocookie.com/embed/5cAZ-VM_MpQ?autoplay=1&mute=1&controls=0&loop=1&playlist=5cAZ-VM_MpQ&playsinline=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0"
              title="Mutual Fund — beleggen met passie"
              allow="autoplay; encrypted-media"
              loading="lazy"
              tabIndex={-1}
            />
          </div>
          <div className="intro-copy">
            <p className="eyebrow">De vereniging</p>
            <h2>Beleggen met passie.</h2>
            <p>
              Mutual Fund is de Amsterdamse beleggingsvereniging voor studenten
              die zelf aandelen willen analyseren. In drie fondsen beheren leden
              echt kapitaal, pitchen ze hun ideeën en stemmen ze over de portefeuille.
            </p>
            <p className="intro-schedule">
              Wij komen bijeen op iedere tweede woensdag van de maand.
            </p>
            <div className="button-row">
              <Link className="button button-primary" href="/word-lid">Word lid</Link>
              <a
                className="button button-outline button-instagram"
                href="https://www.instagram.com/mutual_fund/"
                target="_blank"
                rel="noreferrer"
              >
                Instagram ↗
              </a>
              <a className="text-link" href="#wat-we-doen">Ontdek Mutual Fund →</a>
            </div>
          </div>
        </div>
        <div className="stats-band">
          <div className="container">
            <Stats />
          </div>
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
              Een pitch is pas het begin. Het fonds prikt door de aannames heen,
              bespreekt de risico’s en stemt uiteindelijk met echt geld.
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
            Onze partners schuiven tijdens meetings aan voor een case, marktvisie
            of praktische sessie over het werk in investment banking, private
            equity en asset management.
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
          <div className="membership-feature">
            <figure className="membership-feature-image">
              <img
                src={eventImages.workshop}
                alt="Leden van Mutual Fund tijdens een fondsbespreking"
              />
              <figcaption className="eyebrow">Analyse · discussie · besluit</figcaption>
            </figure>
            <div className="membership-feature-copy">
              <p className="eyebrow">Van interesse naar deelname</p>
              <div className="membership-feature-steps">
                {membershipSteps.map((step) => (
                  <article className="membership-feature-step" key={step.number}>
                    <p className="step-number">{step.number}</p>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                  </article>
                ))}
              </div>
              <Link className="button button-primary" href="/word-lid">
                Start je sollicitatie
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
