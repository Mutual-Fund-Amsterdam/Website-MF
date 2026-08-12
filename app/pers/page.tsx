import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { PageHero } from '../../components/page-hero'
import { publications } from '../../lib/content'

export const metadata: Metadata = {
  title: 'Pers & publicaties',
  description: 'Mutual Fund in de media en contact voor persvragen.',
}

export default function PersPage() {
  return (
    <main id="main-content">
      <PageHero
        index="06 / 07"
        eyebrow="Pers & publicaties"
        title={<>De blik van buiten op <em>Mutual Fund.</em></>}
        description="Mutual Fund en haar leden zijn regelmatig zichtbaar in de media met perspectief op markten, jongeren en beleggen."
      />
      <section className="press-section">
        <div className="site-container press-section__grid">
          <aside>
            <span>Media archive</span>
            <strong>{String(publications.length).padStart(2, '0')}</strong>
            <p>vermeldingen</p>
          </aside>
          <div className="press-list">
            {publications.map((publication, index) => {
              const external = publication.href.startsWith('http')
              return (
                <Link
                  key={`${publication.outlet}-${publication.date}`}
                  href={publication.href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                >
                  <span>0{index + 1}</span>
                  <div><small>{publication.outlet}</small><h2>{publication.title}</h2></div>
                  <time>{publication.date}</time>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        </div>
      </section>
      <section className="press-contact">
        <div className="site-container press-contact__inner">
          <div><p className="eyebrow">Perscontact</p><h2>Op zoek naar een studentenperspectief op de markt?</h2></div>
          <div><p>Voor interviews, achtergrondinformatie en overige persvragen kun je contact opnemen met onze secretaris.</p><a href="mailto:secretaris@mutualfund.nl">secretaris@mutualfund.nl <ArrowUpRight size={16} aria-hidden="true" /></a></div>
        </div>
      </section>
    </main>
  )
}
