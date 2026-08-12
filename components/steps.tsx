import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionHeading } from './section-heading'

const steps = [
  {
    number: '01',
    title: 'Verken de vereniging',
    description: 'Leer onze werkwijze, fondsen en maandelijkse meetings kennen.',
  },
  {
    number: '02',
    title: 'Solliciteer in september of februari',
    description: 'Stuur tijdens een van onze twee jaarlijkse rondes je motivatiebrief en cv.',
  },
  {
    number: '03',
    title: 'Sluit aan bij een meeting',
    description: 'Maak kennis met de leden, de portefeuille en onze manier van analyseren en stemmen.',
  },
]

export function Steps() {
  return (
    <section className="section membership-section market-grid-light">
      <div className="site-container relative z-10">
        <SectionHeading
          eyebrow="Lid worden"
          title={<>Van nieuwsgierig naar <em>investeerder.</em></>}
          description="We zoeken studenten die hun ideeën durven te onderbouwen, kritisch willen leren denken en verantwoordelijkheid willen dragen voor echt kapitaal."
        />
        <ol className="membership-steps">
          {steps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
        <Link href="/contact" className="button button--navy">
          Neem contact op <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
