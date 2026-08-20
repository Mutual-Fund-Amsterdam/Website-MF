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
    title: "Meeting met Teslin Capital Management",
    text: "In maart verwelkomen we Teslin Capital Management voor een inhoudelijke meeting. Teslin neemt onze leden mee in zijn langetermijnbenadering van beleggen, actieve betrokkenheid bij ondernemingen en de afwegingen achter geconcentreerde portefeuilles.",
    image: eventImages.teslin,
  },
  {
    number: "02",
    title: "Trainingen en workshops",
    text: "Een DCF leer je pas echt bouwen door zelf aan de knoppen te zitten. Daarom organiseren we praktische sessies over waardering, financiële modellen en tools als FactSet. Leden werken mee, stellen vragen en nemen een model mee dat ze later opnieuw kunnen gebruiken.",
    image: eventImages.workshop,
  },
  {
    number: "03",
    title: "Inhousedagen",
    text: "Bij PwC waardeerden onze leden Nike in een valuation case, waarbij we het opnamen tegen Bona Fide. Ook stonden de Waterland Investment Services Caseday, de IEX Media Caseday en de IBS Capital Allies Inhousedag op het programma. Je werkt aan een echte case, spreekt het team en krijgt een eerlijk beeld van het werk.",
    image: eventImages.companyDay,
  },
  {
    number: "04",
    title: "Borrels en sociale activiteiten",
    text: "Na de fondsbesprekingen gaan de laptops dicht en begint de borrel. Daarnaast plannen we door het jaar heen losse activiteiten waarbij rendement even niet het belangrijkste gespreksonderwerp is — al lukt dat meestal maar kort.",
    image: eventImages.social,
  },
  {
    number: "05",
    title: "Van beursvloer tot wijnbar: Mutual Fund in Milaan",
    text: "Van Borsa Italiana tot de wijnbars van Milaan: een weekend waarin beleggen, Italië en vooral een goede tijd samenkwamen.",
    image: eventImages.trip,
  },
];

export default function EventsPage() {
  return (
    <main id="main-content" className="page-shell">
      <header className="container page-header">
        <p className="eyebrow">Het hele jaar</p>
        <h1>Events.</h1>
        <p>
          Van een valuation case op kantoor tot een wijnproeverij in Milaan:
          dit gebeurt er buiten de vaste fondsbesprekingen.
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
