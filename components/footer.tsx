import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { BrandMark } from './brand-mark'

const footerLinks = [
  { label: 'Over ons', href: '/over-ons' },
  { label: 'Bestuur', href: '/bestuur' },
  { label: 'Partners', href: '/partners' },
  { label: 'Evenementen', href: '/events' },
  { label: 'Nieuws', href: '/nieuws' },
  { label: 'Pers', href: '/pers' },
]

export function Footer() {
  return (
    <footer className="site-footer market-grid">
      <div className="site-container relative z-10">
        <div className="site-footer__lead">
          <div>
            <p className="eyebrow">Amsterdam · 52.3676° N</p>
            <h2>
              Analyseer scherp.<br />
              <em>Investeer samen.</em>
            </h2>
          </div>
          <Link href="/contact" className="button button--gold">
            Neem contact op <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <BrandMark inverted />
            <p>
              De Amsterdamse beleggingsvereniging waar studenten met echt kapitaal investeren,
              markten analyseren en een professioneel netwerk opbouwen.
            </p>
          </div>

          <div>
            <h3>Navigatie</h3>
            <ul>
              {footerLinks.map((link) => (
                <li key={link.href}><Link href={link.href}>{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Contact</h3>
            <ul>
              <li><a href="mailto:secretaris@mutualfund.nl">secretaris@mutualfund.nl</a></li>
              <li><span>Amsterdam, Nederland</span></li>
            </ul>
          </div>

          <div className="site-footer__signal" aria-label="Verenigingsgegevens">
            <span><i /> Actief sinds 2010</span>
            <strong>80+</strong>
            <p>actieve studenten</p>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Beleggersvereniging Mutual Fund</span>
          <span>Amsterdam · Nederland</span>
        </div>
      </div>
    </footer>
  )
}
