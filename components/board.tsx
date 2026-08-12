import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Linkedin, Mail } from 'lucide-react'
import { boardMembers } from '../lib/content'
import { SectionHeading } from './section-heading'

export function Board({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`section board-section ${compact ? 'board-section--compact' : ''}`}>
      <div className="site-container">
        {!compact ? (
          <SectionHeading
            eyebrow="Bestuur 2025—2026"
            title={<>Verantwoordelijk voor <em>richting.</em></>}
            description="Vier studenten dragen de organisatorische verantwoordelijkheid. Bereikbaar, betrokken en aanspreekbaar voor leden, partners en geïnteresseerden."
            inverted
          />
        ) : null}

        <div className="board-grid">
          {boardMembers.map((member, index) => (
            <article key={member.name} className="board-member">
              <div className="board-member__image">
                <Image
                  src={member.image}
                  alt={`Portret van ${member.name}`}
                  fill
                  sizes="(min-width: 1100px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover grayscale"
                />
                <span>0{index + 1}</span>
              </div>
              <div className="board-member__body">
                <p>{member.role}</p>
                <h3>{member.name}</h3>
                <div className="board-member__links">
                  <a href={`mailto:${member.email}`} aria-label={`E-mail ${member.name}`}>
                    <Mail size={16} aria-hidden="true" /> E-mail
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noreferrer" aria-label={`LinkedIn van ${member.name}`}>
                    <Linkedin size={16} aria-hidden="true" /> LinkedIn
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!compact ? (
          <div className="section-link-row">
            <Link href="/bestuur">Meer over het bestuur <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
