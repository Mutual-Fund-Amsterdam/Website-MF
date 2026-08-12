import Image from 'next/image'
import Link from 'next/link'

const partners = [
  { name: 'FSA', logo: '/partners/fsa.svg', url: 'https://www.fsaweb.nl' },
  { name: 'LYNX', logo: '/partners/lynx.svg', url: 'https://www.lynx.nl' },
  { name: 'J.P. Morgan', logo: '/partners/jpmorgan.svg', url: 'https://www.jpmorgan.com' },
  { name: 'Egeria', logo: '/partners/egeria.svg', url: 'https://www.egeriagroup.com' },
  { name: 'ISB Capital', logo: '/partners/isb-capital.svg', url: 'https://ibsca.nl/' },
  { name: 'Amundi', logo: '/partners/amundi.svg', url: 'https://www.amundi.com' },
  { name: 'Teslin', logo: '/partners/teslin.svg', url: 'https://www.teslin.nl' },
  { name: 'ValueMachinesFund', logo: '/partners/valuemachinesfund.svg', url: 'https://www.valueselections.net/vmf-op-bib-2026/' },
  { name: 'IBS', logo: '/partners/ibs.svg', url: '#' },
]

const benefits = [
  {
    num: '01',
    title: 'Gemotiveerde doelgroep',
    description:
      'Directe toegang tot een selecte groep studenten economie en finance op eind-BSc of MSc niveau — actief bezig met beleggen en financiele markten.',
  },
  {
    num: '02',
    title: "Tell Me Something I Don't Know",
    description:
      'Presenteer tijdens een van onze maandelijkse meetings. Deel kennis, laat je merk zien en ga in gesprek met onze leden.',
  },
  {
    num: '03',
    title: 'Inhouse dag',
    description:
      'Organiseer een inhouse dag via Mutual Fund en laat studenten kennismaken met jouw organisatie en carrieremogelijkheden.',
  },
  {
    num: '04',
    title: 'Vroegtijdig talent',
    description:
      'Bouw een relatie op met studenten voordat ze de arbeidsmarkt betreden. Ideaal voor het werven van stagiairs en young professionals.',
  },
]

export function Partners() {
  return (
    <>
      <section id="partners" className="px-6 py-[120px] md:px-12">
        <div className="mx-auto mb-[72px] grid max-w-7xl items-end gap-6 md:grid-cols-[1fr_2fr] md:gap-16">
          <h2 className="font-serif text-[clamp(36px,4.5vw,56px)] font-normal leading-[1.05] tracking-tight text-navy">
            Onze <em className="font-light italic text-gold">partners.</em>
          </h2>
          <p className="max-w-[540px] text-base leading-relaxed text-muted-foreground">
            Een netwerk van financiele instellingen en studieverenigingen die onze ambitie delen om
            studenten klaar te stomen voor een carriere in de sector.
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
                height={60}
                className="h-auto max-h-14 w-auto max-w-full object-contain opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-navy px-6 py-[120px] md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-[72px] grid items-end gap-6 md:grid-cols-[1fr_2fr] md:gap-16">
            <h2 className="font-serif text-[clamp(36px,4.5vw,56px)] font-normal leading-[1.05] tracking-tight text-cream">
              Word <em className="font-light italic text-gold">partner.</em>
            </h2>
            <p className="max-w-[540px] text-base leading-relaxed text-cream/70">
              Als partner van Mutual Fund krijg je directe toegang tot een gemotiveerde groep
              studenten economie en finance op eind-BSc of MSc niveau.
            </p>
          </div>
          <div className="mb-[72px] grid gap-px bg-cream/10 md:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit.num} className="bg-navy p-10">
                <div className="mb-6 font-serif text-sm italic text-gold">{`— ${benefit.num}`}</div>
                <h3 className="mb-4 font-serif text-2xl font-medium text-cream">
                  {benefit.title}
                </h3>
                <p className="text-base leading-relaxed text-cream/70">{benefit.description}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="mailto:secretaris@mutualfund.nl?subject=Partnership%20Mutual%20Fund"
              className="inline-flex items-center gap-3 bg-gold px-8 py-4 text-sm font-semibold uppercase tracking-wider text-navy transition-opacity hover:opacity-90"
            >
              Neem contact op <span>{"→"}</span>
            </Link>
            <span className="text-sm text-cream/50">secretaris@mutualfund.nl</span>
          </div>
        </div>
      </section>
    </>
  )
}
