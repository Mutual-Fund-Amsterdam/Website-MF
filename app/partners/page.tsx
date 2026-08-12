import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageHero } from '../../components/page-hero'
import { Partners } from '../../components/partners'

export const metadata: Metadata = {
  title: 'Partners',
  description: 'Ontdek de organisaties die Mutual Fund en haar leden verbinden met de financiële praktijk.',
}

export default function PartnersPage() {
  return (
    <main id="main-content">
      <PageHero
        index="03 / 07"
        eyebrow="Partnernetwerk"
        title={<>Expertise die de collegezaal <em>overstijgt.</em></>}
        description="Onze partners openen deuren naar de praktijk met workshops, inhousedagen, expertise en een netwerk binnen uiteenlopende disciplines van de financiële sector."
        aside={<Link href="/contact" className="text-link-light">Partner worden <ArrowRight size={16} aria-hidden="true" /></Link>}
      />
      <Partners />
      <section className="partner-value-section market-grid-light">
        <div className="site-container partner-value-section__grid">
          <div><span>01</span><h2>Kennis delen</h2><p>Breng specialistische marktkennis rechtstreeks naar een ambitieuze groep financieel georiënteerde studenten.</p></div>
          <div><span>02</span><h2>Talent ontmoeten</h2><p>Maak vroeg kennis met analytisch sterke studenten die bewust bouwen aan een carrière in finance.</p></div>
          <div><span>03</span><h2>Relatie opbouwen</h2><p>Word zichtbaar binnen een actieve vereniging met een groeiend alumninetwerk en langdurige partnerrelaties.</p></div>
        </div>
      </section>
    </main>
  )
}
