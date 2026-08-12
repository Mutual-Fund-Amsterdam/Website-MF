import { Navigation } from '../../components/navigation'
import { Footer } from '../../components/footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Over ons - Mutual Fund',
  description: 'Leer meer over Mutual Fund, de beleggingsvereniging voor studenten in Amsterdam.',
}

const programItems = [
  { time: '19:00', description: 'Start maandelijkse meeting' },
  { time: '19:15', description: 'Macro-economische update door de Macro-commissie' },
  { time: '19:30', description: "Tell Me Something I Don't Know" },
  { time: '20:15', description: 'Pauze' },
  { time: '20:45', description: 'Afzonderlijke fondsbesprekingen (fonds 1, 2 & 3)' },
  { time: '22:00', description: 'Afsluitende borrel op externe locatie' },
]

export default function OverOnsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-cream pt-32">
        <section className="px-6 pb-20 md:px-12">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-8 font-serif text-[clamp(40px,5vw,64px)] font-normal leading-[1.05] tracking-tight text-navy">
              Over het <em className="font-light italic text-gold">Mutual Fund.</em>
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Mutual Fund is een vereniging voor studenten met een affiniteit voor beleggen en
              financiele markten. Mutual Fund heeft zowel een educatief en sociaal doeleinde.
            </p>
          </div>
        </section>
        <section className="bg-navy px-6 py-20 md:px-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 font-serif text-[clamp(32px,4vw,48px)] font-normal leading-tight text-cream">
              Programma
            </h2>
            <p className="mb-10 text-base leading-relaxed text-cream/70">
              Het programma van een Mutual Fund-meeting ziet er normaal gesproken als volgt uit:
            </p>
            <div className="space-y-0">
              {programItems.map((item, index) => (
                <div key={index} className="flex border-b border-cream/10 py-4 first:border-t">
                  <span className="w-20 shrink-0 font-serif text-lg text-gold">{item.time}</span>
                  <span className="text-base text-cream/90">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-cream-light px-6 py-20 md:px-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 font-serif text-[clamp(28px,3.5vw,40px)] font-normal leading-tight text-navy">
              Macro-Economische Update
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Maandelijks geeft onze macro-commissie een update over belangrijke macro-economische
              gebeurtenissen van de afgelopen maand.
            </p>
          </div>
        </section>
        <section className="bg-cream px-6 py-20 md:px-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 font-serif text-[clamp(28px,3.5vw,40px)] font-normal leading-tight text-navy">
              Tell Me Something I Don&apos;t Know
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Op de maandelijkse meeting wordt er een Tell Me Something I Don&apos;t Know (TMSIDK)
              gegeven door een bedrijf uit ons partnernetwerk. Het doel is om de
              beleggingsinhoudelijke kennis van onze leden te verbreden en te verdiepen.
              Zo is recentelijk bijvoorbeeld IBS Capital Allies langsgekomen om te vertellen over
              waardebeleggen.
            </p>
          </div>
        </section>
        <section className="bg-cream-light px-6 py-20 md:px-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 font-serif text-[clamp(28px,3.5vw,40px)] font-normal leading-tight text-navy">
              Fondsbespreking
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Binnen Mutual Fund zijn er drie fondsen (Fonds 1, Fonds 2 en Fonds 3). Elk fonds
              bestaat uit ongeveer 25 leden, die allen een bedrag van 500 euro inleggen, en ieder
              een specifiek aandeel volgen binnen de fondsportefeuille.
            </p>
          </div>
        </section>
        <section className="bg-cream px-6 py-20 md:px-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 font-serif text-[clamp(28px,3.5vw,40px)] font-normal leading-tight text-navy">
              Andere Evenementen
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Naast de maandelijkse meetings worden er ook andere evenementen georganiseerd,
              zoals workshops, inhousedagen en sociale activiteiten. Elk jaar organiseren we
              ook een reis.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
