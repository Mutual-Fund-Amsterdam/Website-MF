import { BarChart3, MessageSquareQuote, Scale } from 'lucide-react'
import { SectionHeading } from './section-heading'

const pillars = [
  {
    number: '01',
    icon: BarChart3,
    title: 'Analyse zonder shortcuts',
    description:
      'Iedere positie wordt maandelijks doorgelicht op rendement, vooruitzichten en relevant nieuws. Leden leren verder kijken dan de koers alleen.',
    signal: 'Research / monitoring',
  },
  {
    number: '02',
    icon: MessageSquareQuote,
    title: 'Een thesis moet standhouden',
    description:
      'Buy- en sell-pitches worden onderbouwd, bevraagd en aangescherpt. De vereniging stemt democratisch na een inhoudelijke discussie.',
    signal: 'Pitch / debate',
  },
  {
    number: '03',
    icon: Scale,
    title: 'Drie fondsen, één standaard',
    description:
      'Onze drie fondsen concurreren op rendement. Die gezonde rivaliteit houdt leden scherp en maakt iedere allocatie een bewuste keuze.',
    signal: 'Allocate / evaluate',
  },
]

export function Pillars() {
  return (
    <section id="home-intro" className="section section--cream">
      <div className="site-container">
        <SectionHeading
          eyebrow="Onze aanpak"
          title={<>De markt is het <em>klaslokaal.</em></>}
          description="Geen simulatie, geen vrijblijvende case. Onze leden leggen samen kapitaal in, onderzoeken beursgenoteerde ondernemingen en dragen verantwoordelijkheid voor iedere beslissing."
        />
        <div className="thesis-list">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <article key={pillar.number}>
                <div className="thesis-list__index">{pillar.number}</div>
                <div className="thesis-list__icon"><Icon size={22} strokeWidth={1.5} aria-hidden="true" /></div>
                <div>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.description}</p>
                </div>
                <span className="thesis-list__signal">{pillar.signal}</span>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
