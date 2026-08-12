import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { PageHero } from '../../components/page-hero'
import { SectionHeading } from '../../components/section-heading'
import { programItems } from '../../lib/content'

export const metadata: Metadata = {
  title: 'Over ons',
  description: 'Ontdek Mutual Fund, de Amsterdamse beleggingsvereniging waar studenten met echt kapitaal investeren.',
}

const funds = [
  { name: 'Fonds 01', members: '±25 leden', focus: 'Research · pitches · allocatie' },
  { name: 'Fonds 02', members: '±25 leden', focus: 'Research · pitches · allocatie' },
  { name: 'Fonds 03', members: '±25 leden', focus: 'Research · pitches · allocatie' },
]

export default function OverOnsPage() {
  return (
    <main id="main-content">
      <PageHero
        index="01 / 07"
        eyebrow="Over Mutual Fund"
        title={<>Geen papieren portefeuille.<br /><em>Wel echte verantwoordelijkheid.</em></>}
        description="Mutual Fund is in 2010 opgericht voor studenten met een fascinatie voor beleggen en financiële markten. Vandaag vormen meer dan 80 actieve studenten een educatieve én sociale investment community."
        aside={<Link href="/contact" className="text-link-light">Lid worden <ArrowRight size={16} aria-hidden="true" /></Link>}
      />

      <section className="section section--cream">
        <div className="site-container editorial-grid">
          <div className="editorial-grid__aside">
            <span>Onze overtuiging</span>
            <p>Education through allocation</p>
          </div>
          <div className="editorial-grid__body">
            <p className="editorial-lead">
              Beleggen leer je niet alleen uit een boek. Je leert het door een thesis te bouwen,
              die tegenover kritische medestudenten te verdedigen en vervolgens samen een besluit
              te nemen over <em>echt kapitaal.</em>
            </p>
            <div className="editorial-columns">
              <p>
                Mutual Fund combineert analytische verdieping met gezamenlijke besluitvorming.
                Ieder lid volgt een onderneming binnen de portefeuille en houdt het fonds op de
                hoogte van relevante ontwikkelingen.
              </p>
              <p>
                Partners, alumni en gastsprekers brengen de praktijk dichtbij. Daardoor groeit
                niet alleen marktkennis, maar ook het netwerk dat studenten voorbereidt op een
                loopbaan binnen finance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="funds-section market-grid">
        <div className="site-container relative z-10">
          <SectionHeading
            eyebrow="Portfolio architecture"
            title={<>Drie fondsen.<br /><em>Één scherpe standaard.</em></>}
            description="Elk fonds bestaat uit ongeveer 25 leden. Ieder lid legt €500 in, volgt een aandeel en draagt bij aan de gezamenlijke portefeuille."
            inverted
          />
          <div className="funds-grid">
            {funds.map((fund, index) => (
              <article key={fund.name}>
                <div className="funds-grid__head"><span>{fund.name}</span><i>0{index + 1}</i></div>
                <strong>{fund.members}</strong>
                <p>{fund.focus}</p>
                <div className="funds-grid__line"><span style={{ width: `${72 + index * 8}%` }} /></div>
              </article>
            ))}
          </div>
          <ul className="fund-principles">
            <li><Check size={16} aria-hidden="true" /> Maandelijkse evaluatie</li>
            <li><Check size={16} aria-hidden="true" /> Democratische besluitvorming</li>
            <li><Check size={16} aria-hidden="true" /> Onderlinge rendementscompetitie</li>
          </ul>
        </div>
      </section>

      <section className="section meeting-section">
        <div className="site-container">
          <SectionHeading
            eyebrow="Iedere tweede woensdag"
            title={<>Een avond met <em>ritme.</em></>}
            description="De maandelijkse meeting volgt een vaste structuur: van macrobeeld en nieuwe inzichten naar de concrete beslissingen binnen ieder fonds."
          />
          <div className="meeting-table" role="table" aria-label="Programma van een Mutual Fund-meeting">
            {programItems.map((item, index) => (
              <div key={item.time} role="row">
                <span role="cell">0{index + 1}</span>
                <time role="cell">{item.time}</time>
                <p role="cell">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="knowledge-strip">
        <div className="site-container knowledge-strip__grid">
          <article><span>01</span><h2>Macro-economische update</h2><p>De Macro-commissie duidt maandelijks de belangrijkste economische gebeurtenissen en hun impact op de portefeuille.</p></article>
          <article><span>02</span><h2>Tell Me Something I Don’t Know</h2><p>Een expert uit ons partnernetwerk verbreedt de beleggingsinhoudelijke kennis van de leden met een nieuw perspectief.</p></article>
          <article><span>03</span><h2>Meer dan meetings</h2><p>Workshops, inhousedagen, sociale activiteiten en de jaarlijkse reis verbinden verdieping met een hechte community.</p></article>
        </div>
      </section>
    </main>
  )
}
