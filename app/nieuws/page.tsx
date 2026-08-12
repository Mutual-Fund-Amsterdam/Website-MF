import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { PageHero } from '../../components/page-hero'
import { newsItems } from '../../lib/content'

export const metadata: Metadata = {
  title: 'Nieuws',
  description: 'Nieuws, mijlpalen en verhalen van Mutual Fund Amsterdam.',
}

export default function NieuwsPage() {
  return (
    <main id="main-content">
      <PageHero
        index="05 / 07"
        eyebrow="Nieuws & verhalen"
        title={<>Momenten die onze <em>koers</em> bepalen.</>}
        description="Van bijzondere mijlpalen tot internationale reizen: volg de ontwikkelingen binnen Mutual Fund en de community eromheen."
      />

      <section className="news-section">
        <div className="site-container">
          <div className="news-section__label"><span>Laatste updates</span><i /></div>
          <div className="news-grid">
            {newsItems.map((item, index) => (
              <Link key={item.title} href={item.href} className={item.featured ? 'news-card news-card--featured' : 'news-card'}>
                <div className="news-card__meta"><span>{item.category}</span><time>{item.date}</time></div>
                <div className="news-card__signal" aria-hidden="true">
                  <svg viewBox="0 0 500 150">
                    <path d={index === 0 ? 'M0 120C60 110 85 128 135 92C185 55 220 85 275 55C330 25 390 65 500 15' : 'M0 100C70 115 105 55 160 75C220 98 270 20 340 55C395 82 430 45 500 30'} />
                  </svg>
                </div>
                <h2>{item.title}</h2>
                <p>{item.excerpt}</p>
                <span className="news-card__link">Lees verder <ArrowUpRight size={16} aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
          <div className="news-archive-state"><span>Archief wordt aangevuld</span><p>Nieuwe publicaties en verenigingsupdates verschijnen hier zodra ze beschikbaar zijn.</p></div>
        </div>
      </section>
    </main>
  )
}
