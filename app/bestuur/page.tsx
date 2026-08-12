import type { Metadata } from 'next'
import { ArrowRight, ShieldCheck, Users, Waypoints } from 'lucide-react'
import Link from 'next/link'
import { PageHero } from '../../components/page-hero'
import { Board } from '../../components/board'

export const metadata: Metadata = {
  title: 'Bestuur',
  description: 'Maak kennis met het huidige bestuur van Mutual Fund Amsterdam.',
}

const principles = [
  { icon: Waypoints, label: 'Richting', text: 'De lange termijn van de vereniging bewaken en nieuwe initiatieven ontwikkelen.' },
  { icon: ShieldCheck, label: 'Verantwoordelijkheid', text: 'Transparant omgaan met leden, partners en de organisatie van alle activiteiten.' },
  { icon: Users, label: 'Toegankelijkheid', text: 'Bereikbaar en aanspreekbaar zijn voor iedere student en geïnteresseerde.' },
]

export default function BestuurPage() {
  return (
    <main id="main-content">
      <PageHero
        index="02 / 07"
        eyebrow="Bestuur 2025—2026"
        title={<>Vier perspectieven.<br /><em>Eén verantwoordelijkheid.</em></>}
        description="Het bestuur geeft richting aan de vereniging, organiseert de meetings en onderhoudt het contact met leden, alumni en partners."
      />
      <Board compact />
      <section className="governance-section">
        <div className="site-container governance-section__grid">
          <div>
            <p className="eyebrow">Governance</p>
            <h2>Besturen met <em>lange termijn</em> in gedachten.</h2>
          </div>
          <div className="governance-principles">
            {principles.map((principle) => {
              const Icon = principle.icon
              return (
                <article key={principle.label}>
                  <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                  <h3>{principle.label}</h3>
                  <p>{principle.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>
      <section className="inline-cta">
        <div className="site-container inline-cta__inner">
          <div><span>Contact met het bestuur</span><h2>Een vraag, idee of samenwerking?</h2></div>
          <Link href="/contact" className="button button--gold">Neem contact op <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  )
}
