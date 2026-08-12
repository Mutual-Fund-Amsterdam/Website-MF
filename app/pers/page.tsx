import Link from 'next/link'
import { Navigation } from '../../components/navigation'
import { Footer } from '../../components/footer'

export const metadata = {
  title: 'Pers & Publicaties - Mutual Fund',
  description: 'Mutual Fund in de media.',
}

const publications = [
  {
    outlet: 'Nieuwsuur NOS',
    title: "Hoge beurskoersen terwijl de wereld in brand staat",
    date: '2026',
    href: 'https://nos.nl/nieuwsuur/video/2598071-hoge-beurskoersen-terwijl-de-wereld-in-brand-staat',
    isVideo: true, // Hier is het vlaggetje voor de video!
  },
  {
    outlet: 'de Volkskrant',
    title: "Deze jonge investeerders oefenen voor later",
    date: '2025',
    href: 'https://www.volkskrant.nl/economie/deze-jonge-investeerders-oefenen-voor-later-hoe-eerder-je-begint-hoe-meer-vermogen-je-opbouwt~b0127cd9/',
  },
  {
    outlet: 'Het Parool',
    title: "Crisis? Voor de studenten van deze beleggingsclub zijn het mooie tijden: ‘Gewoon rustig blijven’",
    date: '2025',
    href: 'https://www.parool.nl/amsterdam/crisis-voor-de-studenten-van-deze-beleggingsclub-zijn-het-mooie-tijden-gewoon-rustig-blijven~b885bbd7/?referrer=https%3A%2F%2Fwww.google.com%2F',
  },
  {
    outlet: 'Beleggers Belangen',
    title: "Studentenbeleggers van Mutual Fund",
    date: '2023',
    href: '#',
  },
  {
    outlet: 'Het Financieele Dagblad',
    title: 'Amsterdamse studenten beheren eigen beleggingsfonds',
    date: '2022',
    href: '#',
  },
  {
    outlet: 'Het Parool',
    title: 'Mutual Fund: waar studenten leren beleggen met echt geld',
    date: '2021',
    href: '#',
  },
  {
    outlet: 'Het Parool',
    title: 'Beleggingsclubjes: eerst beleggen en dan door naar de kroeg',
    date: '2020',
    href: 'https://www.parool.nl/ps/beleggingsclubjes-eerst-beleggen-en-dan-door-naar-de-kroeg~bd92a06c/',
  },
  {
    outlet: 'De Telegraaf',
    title: 'Jonge beleggers zien kansen ondanks turbulente markten',
    date: '2020',
    href: '#',
  },
]

export default function PersPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-cream pt-32 pb-24">
        <div className="mx-auto max-w-4xl px-6 md:px-12">
          <div className="mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Media
            </p>
            <h1 className="mb-6 font-serif text-4xl font-medium tracking-tight text-navy md:text-5xl">
              Pers & Publicaties
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Mutual Fund is regelmatig in het nieuws.
            </p>
          </div>
          
          <div className="space-y-0">
            {publications.map((pub, index) => (
              <Link
                key={index}
                href={pub.href}
                target={pub.href.startsWith('http') ? '_blank' : undefined}
                rel={pub.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="group block border-b border-line py-8 transition-colors first:border-t hover:bg-cream-light"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-gold">
                      {pub.outlet}
                    </p>
                    <h2 className="font-serif text-xl font-medium text-navy md:text-2xl flex items-center gap-2">
                      {pub.title}
                      {pub.isVideo && (
                        <span title="Video" className="shrink-0 flex items-center justify-center bg-gold/10 text-gold rounded-full p-1.5 transition-colors group-hover:bg-gold/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </h2>
                  </div>
                  <span className="text-sm text-muted-foreground">{pub.date}</span>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-16 border border-line bg-cream-light p-8">
            <h3 className="mb-3 font-serif text-2xl font-medium text-navy">Perscontact</h3>
            <p className="mb-6 text-muted-foreground">
              Voor persvragen kunt u contact opnemen met onze secretaris.
            </p>
            <Link
              href="mailto:secretaris@mutualfund.nl"
              className="inline-flex items-center gap-2 bg-navy px-6 py-3 text-sm font-medium text-cream hover:bg-navy/90 transition-colors"
            >
              secretaris@mutualfund.nl
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
