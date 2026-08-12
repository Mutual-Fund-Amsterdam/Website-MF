import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { partnerLogos } from '../lib/content'
import { SectionHeading } from './section-heading'

export function Partners({ limit }: { limit?: number }) {
  const logos = limit ? partnerLogos.slice(0, limit) : partnerLogos

  return (
    <section className="section partners-section">
      <div className="site-container">
        <SectionHeading
          eyebrow="Partnernetwerk"
          title={<>Verbonden met de <em>markt.</em></>}
          description="Onze partners brengen expertise, perspectief en toegang tot de financiële sector. Samen verbinden we academische nieuwsgierigheid aan de praktijk."
        />

        <div className="partner-grid">
          {logos.map((partner, index) => (
            <a key={partner.name} href={partner.url} target="_blank" rel="noopener noreferrer" className="partner-tile">
              <span>0{index + 1}</span>
              <Image
                src={partner.src}
                alt={`${partner.name} logo`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="partner-tile__logo object-contain"
              />
              <strong>{partner.name}</strong>
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          ))}
        </div>

        {limit ? (
          <div className="section-link-row section-link-row--dark">
            <Link href="/partners">Bekijk alle partners <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
