import Link from 'next/link'
import { ArrowDown, ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="home-hero market-grid">
      <div className="site-container home-hero__inner">
        <div className="home-hero__meta">
          <span>Student investment society</span>
          <span>Amsterdam · NL</span>
          <span>Est. 2010</span>
        </div>

        <div className="home-hero__grid">
          <div className="home-hero__copy">
            <p className="eyebrow">Echt kapitaal · echte besluiten</p>
            <h1>
              Analyse wordt<br />
              <em>overtuiging.</em>
            </h1>
            <p className="home-hero__intro">
              Mutual Fund is de Amsterdamse beleggingsvereniging waar ambitieuze studenten
              financiële markten doorgronden, met echt kapitaal beleggen en een professioneel
              netwerk opbouwen.
            </p>
            <div className="home-hero__actions">
              <Link href="/over-ons" className="button button--gold">
                Ontdek Mutual Fund <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/contact" className="button button--ghost-light">Word lid</Link>
            </div>
          </div>

          <div className="investment-system" aria-label="Het beleggingsproces van Mutual Fund">
            <div className="investment-system__head">
              <span>Investment process</span>
              <i>MF / 03 Funds</i>
            </div>
            <div className="investment-system__film">
              <iframe
                src="https://www.youtube-nocookie.com/embed/5cAZ-VM_MpQ?autoplay=1&mute=1&controls=0&loop=1&playlist=5cAZ-VM_MpQ&playsinline=1&rel=0&disablekb=1&modestbranding=1&iv_load_policy=3"
                title="Sfeerimpressie van Mutual Fund"
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                tabIndex={-1}
              />
              <div className="investment-system__film-shade" aria-hidden="true" />
              <div className="investment-system__film-label" aria-hidden="true">
                <span>Inside Mutual Fund</span>
                <i>Amsterdam / NL</i>
              </div>
            </div>
            <ol className="investment-system__steps">
              <li><span>01</span><strong>Research</strong><small>Markt & onderneming</small></li>
              <li><span>02</span><strong>Pitch</strong><small>Thesis & waardering</small></li>
              <li><span>03</span><strong>Vote</strong><small>Kritisch debat</small></li>
              <li><span>04</span><strong>Allocate</strong><small>Echt kapitaal</small></li>
            </ol>
          </div>
        </div>

        <a href="#home-intro" className="home-hero__scroll">
          <ArrowDown size={16} aria-hidden="true" /> Scroll om te ontdekken
        </a>
      </div>
    </section>
  )
}
