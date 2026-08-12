import Image from 'next/image'
import Link from 'next/link'

const partners = [
  { name: 'FSA', logo: '/partners/fsa.svg', url: 'https://www.fsaweb.nl' },
  { name: 'LYNX', logo: '/partners/lynx.svg', url: 'https://www.lynx.nl' },
  { name: 'J.P. Morgan', logo: '/partners/jpmorgan.svg', url: 'https://www.jpmorgan.com' },
  { name: 'Egeria', logo: '/partners/egeria.svg', url: 'https://www.egeriagroup.com' },
  { name: 'ISB Capital', logo: '/partners/isb-capital.svg', url: 'https://www.isbcapital.com' },
  { name: 'Amundi', logo: '/partners/amundi.svg', url: 'https://www.amundi.com' },
  { name: 'Teslin', logo: '/partners/teslin.svg', url: 'https://www.teslin.nl' },
  { name: 'ValueMachinesFund', logo: '/partners/valuemachinesfund.svg', url: '#' },
]

export function Partners() {
  return (
    <section id="partners" className="px-6 py-[120px] md:px-12">
      <div className="mx-auto mb-[72px] grid max-w-7xl items-end gap-6 md:grid-cols-[1fr_2fr] md:gap-16">
        <h2 className="font-serif text-[clamp(36px,4.5vw,56px)] font-normal leading-[1.05] tracking-tight text-navy">
          Onze <em className="font-light italic text-gold">partners.</em>
        </h2>
        <p className="max-w-[540px] text-base leading-relaxed text-muted-foreground">
          Een netwerk van financiële instellingen en studieverenigingen die onze ambitie delen om
          studenten klaar te stomen voor een carrière in de sector.
        </p>
      </div>
      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4">
        {partners.map((partner) => (
          <Link
            key={partner.name}
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex aspect-square items-center justify-center border border-line bg-cream-light p-8 transition-all hover:border-gold hover:bg-cream"
          >
            <Image
              src={partner.logo}
              alt={partner.name}
              width={160}
              height={80}
              className="h-auto max-h-16 w-auto max-w-full object-contain opacity-70 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0"
            />
          </Link>
        ))}
        <div className="flex aspect-square items-center justify-center border border-line bg-cream-light p-8">
          <span className="font-serif text-sm italic text-muted-foreground/40">Partner pending</span>
        </div>
      </div>
    </section>
  )
}
