import Image from 'next/image'

const partnerLogos = [
  { name: 'JPMorgan', src: '/partners/logos/jpmorgan.svg', url: 'https://www.jpmorgan.com' },
  { name: 'Egeria', src: '/partners/logos/egeria.svg', url: 'https://egeriagroup.com' },
  { name: 'FSA', src: '/partners/logos/fsa.svg', url: 'https://fsa.nl' },
  { name: 'IBS Capital', src: '/partners/logos/isb-capital.svg', url: 'https://www.isbcapital.nl' },
  { name: 'Lynx', src: '/partners/logos/lynx.svg', url: 'https://www.lynx.nl' },
  { name: 'Teslin', src: '/partners/logos/teslin.svg', url: 'https://www.teslin.nl' },
  { name: 'FactSet', src: '/partners/logos/factset.webp', url: 'https://www.factset.com' },
  { name: 'Photon Capital', src: '/partners/logos/photon-capital.webp', url: 'https://photoncapital.com' },
  { name: 'SilverCross Investment Management', src: '/partners/logos/silvercross.webp', url: 'https://silvercross-im.com' },
  { name: 'DUFAS', src: '/partners/logos/dufas.webp', url: 'https://dufas.nl' },
  { name: 'Add Value Fund', src: '/partners/logos/add-value-fund.webp', url: 'https://addvaluefund.nl' },
  { name: 'B&R Beurs', src: '/partners/logos/bnr-beurs.webp', url: 'https://bnrbeurs.nl' },
]

export function Partners() {
  // 💡 Slim trucje: we maken één lange array met 2x de logo's erin
  const duplicatedLogos = [...partnerLogos, ...partnerLogos]

  return (
    <section id="partners" className="bg-cream-light py-24 border-y border-line">
      <div className="mx-auto max-w-6xl px-6 md:px-12 mb-12 text-center">
        <h2 className="font-serif text-3xl font-medium text-navy">Onze Partners</h2>
        <p className="mt-4 text-muted-foreground">Mede mogelijk gemaakt door marktleiders in de financiële sector.</p>
      </div>

      <div className="animate-marquee-container">
        {/* We hebben nu maar 1 balk, dus ze kunnen elkaar nooit meer inhalen! */}
        <div className="animate-marquee gap-16 px-8 items-center">
          {duplicatedLogos.map((logo, i) => (
            <a 
              key={i} 
              href={logo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative h-12 w-32 shrink-0 grayscale transition-all duration-300 hover:grayscale-0 opacity-70 hover:opacity-100 block"
            >
              <Image src={logo.src} alt={logo.name} fill className="object-contain" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
