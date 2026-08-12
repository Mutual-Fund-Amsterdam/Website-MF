import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { PageHero } from '../../components/page-hero'
import { eventCategories } from '../../lib/content'

export const metadata: Metadata = {
  title: 'Evenementen',
  description: 'Workshops, inhousedagen, sociale activiteiten en de jaarlijkse Mutual Fund-reis.',
}

export default function EventsPage() {
  return (
    <main id="main-content">
      <PageHero
        index="04 / 07"
        eyebrow="Events & activiteiten"
        title={<>Kennis groeit wanneer je haar <em>activeert.</em></>}
        description="Naast de maandelijkse meetings organiseren we activiteiten die vaardigheden verdiepen, de financiële sector dichterbij brengen en onze community versterken."
      />

      <section className="events-index">
        <div className="site-container">
          <div className="events-index__header">
            <p>Programma-architectuur</p>
            <span>Doorlopend tijdens het academisch jaar</span>
          </div>
          <div className="events-list">
            {eventCategories.map((event) => (
              <article key={event.index}>
                <span className="events-list__number">{event.index}</span>
                <div className="events-list__title">
                  <small>{event.label}</small>
                  <h2>{event.title}</h2>
                </div>
                <p>{event.description}</p>
                <i aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="monthly-meeting market-grid">
        <div className="site-container monthly-meeting__grid">
          <div className="monthly-meeting__icon"><CalendarDays size={30} strokeWidth={1.4} aria-hidden="true" /></div>
          <div>
            <p className="eyebrow">Vast moment</p>
            <h2>Iedere tweede woensdag van de maand.</h2>
          </div>
          <p>
            Tijdens de vaste meeting komen macro-analyse, kennisdeling en de afzonderlijke
            fondsbesprekingen samen. Daarna sluiten we de avond af op een externe locatie.
          </p>
          <Link href="/over-ons" className="button button--ghost-light">Bekijk het programma <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="inline-cta inline-cta--light">
        <div className="site-container inline-cta__inner">
          <div><span>Deelnemen</span><h2>Toegang tot het volledige programma?</h2></div>
          <Link href="/contact" className="button button--navy">Ontdek het lidmaatschap <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  )
}
