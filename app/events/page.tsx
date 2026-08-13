/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { eventImages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Events",
  description: "Trainingen, inhousedagen, sociale activiteiten en de jaarlijkse reis van Mutual Fund.",
};

const events = [
  {
    number: "01",
    title: "Trainingen en workshops",
    text: "Regelmatig organiseren we trainingen en workshops om de hard skills die belangrijk zijn binnen de financiële sector bij te brengen aan onze leden. Voorbeelden zijn het waarderen van bedrijven met financiële modellen zoals de DCF en het werken met veelgebruikte financiële software als FactSet. Zo breiden leden hun vaardigheden uit en worden zij voorbereid op een carrière binnen de financiële sector.",
    image: eventImages.workshop,
  },
  {
    number: "02",
    title: "Inhousedagen",
    text: "In de afgelopen jaren organiseerden we meerdere inhousedagen bij partners, waaronder de Waterland Investment Services Caseday, de IEX Media Caseday en de IBS Capital Allies Inhousedag. Leden ervaren zo van dichtbij hoe teams werken, waar investeringsbeslissingen ontstaan en welke loopbaanmogelijkheden de sector biedt.",
    image: eventImages.meeting,
  },
  {
    number: "03",
    title: "Borrels en sociale activiteiten",
    text: "Naast alle educatieve activiteiten vinden we het belangrijk om elkaar beter te leren kennen. Na ieder evenement praten we na met een drankje en door het jaar heen organiseren we meerdere borrels en sociale activiteiten om de hechte sfeer binnen de vereniging te behouden.",
    image: eventImages.social,
  },
  {
    number: "04",
    title: "MF Reis",
    text: "Eens per jaar organiseren we een reis van enkele dagen voor onze leden, meestal naar een Europese stad. In de afgelopen jaren reisde Mutual Fund onder meer naar Lissabon en Budapest. Bedrijfsbezoeken en inhoudelijke sessies worden gecombineerd met tijd om de stad en elkaar te leren kennen.",
    image: eventImages.london,
  },
];

export default function EventsPage() {
  return (
    <main id="main-content" className="page-shell">
      <header className="container page-header">
        <p className="eyebrow">Het hele jaar</p>
        <h1>Events.</h1>
        <p>
          Naast de maandelijkse meetings organiseren we inhoudelijke en sociale
          activiteiten die vaardigheden, netwerk en vereniging samenbrengen.
        </p>
      </header>
      <section className="container event-list">
        {events.map((event, index) => (
          <article className={`event-row${index % 2 ? " is-reversed" : ""}`} key={event.number}>
            <div className="event-image"><img src={event.image} alt="" /></div>
            <div className="event-copy">
              <p className="eyebrow">{event.number}</p>
              <h2>{event.title}.</h2>
              <p>{event.text}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="section page-cta">
        <div className="container page-cta-inner">
          <div>
            <p className="eyebrow">Doe mee</p>
            <h2>Beleef de volgende meeting van binnenuit.</h2>
          </div>
          <Link className="button button-primary" href="/word-lid">Word lid</Link>
        </div>
      </section>
    </main>
  );
}
