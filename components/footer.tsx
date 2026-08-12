import Link from 'next/link'

const footerLinks = {
  vereniging: [
    { label: 'Over ons', href: '/over-ons' },
    { label: 'Bestuur', href: '/#bestuur' },
    { label: 'Partners', href: '/#partners' },
    { label: 'Events', href: '/events' },
  ],
  pers: [
    { label: 'Alle publicaties', href: '/pers' },
    { label: 'de Volkskrant', href: 'https://www.volkskrant.nl/economie/deze-jonge-investeerders-oefenen-voor-later-hoe-eerder-je-begint-hoe-meer-vermogen-je-opbouwt~b0127cd9/' },
    { label: 'Beleggers Belangen', href: '/pers' },
    { label: 'Het Financieele Dagblad', href: '/pers' },
  ],
  contact: [
    { label: 'secretaris@mutualfund.nl', href: 'mailto:secretaris@mutualfund.nl' },
    { label: 'LinkedIn', href: '#' },
    { label: 'Facebook', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-navy-deep px-6 pb-8 pt-20 text-cream md:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Top section */}
        <div className="grid grid-cols-1 gap-10 border-b border-cream/10 pb-14 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-12">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="mb-4 inline-block font-serif text-[28px] font-medium tracking-tight"
            >
              Mutual <span className="italic text-gold">Fund</span>
            </Link>
            <p className="max-w-[320px] text-[15px] leading-relaxed text-cream/60">
              Beleggingsvereniging voor financieel georiënteerde studenten in Amsterdam. Sinds 2014.
            </p>
          </div>

          {/* Vereniging */}
          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.1em] text-gold-soft">
              Vereniging
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.vereniging.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/70 transition-colors hover:text-gold-soft"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pers */}
          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.1em] text-gold-soft">
              Pers
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.pers.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/70 transition-colors hover:text-gold-soft"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.1em] text-gold-soft">
              Contact
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.contact.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/70 transition-colors hover:text-gold-soft"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 flex flex-col gap-3 text-sm text-cream/50 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Beleggersvereniging Mutual Fund</span>
          <Link href="#" className="transition-colors hover:text-cream/70">
            Privacy &amp; Cookies
          </Link>
        </div>
      </div>
    </footer>
  )
}
