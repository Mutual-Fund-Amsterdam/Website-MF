import { Navigation } from '../../components/navigation'
import { Footer } from '../../components/footer'

const eventCategories = [
  {
    title: 'Trainingen en workshops',
    description:
      'Regelmatig organiseren we trainingen en workshops, om ook de hard skills die belangrijk zijn binnen de financiële sector bij te brengen aan onze leden. Voorbeelden hiervan zijn bijvoorbeeld het leren valueren van bedrijven met financiële modellen als de DCF, of het leren werken met veelgebruikte financiële software als FactSet. Naast het feit dat leden hiermee hun vaardigheden uitbreiden, worden ze hiermee ook klaargestoomd voor een carrière binnen de financiële sector.',
  },
  {
    title: 'Inhousedagen',
    description:
      'In de afgelopen jaren zijn meerdere inhousedagen bij partners van het Mutual Fund georganiseerd. Voorbeelden hiervan zijn de Waterland Investment Services Caseday, de IEX Media Caseday, en de IBS Capital Allies Inhousedag. Ook dit jaar zullen we naar alle waarschijnlijkheid een inhousedag met onze partner IBS Capital Allies organiseren.',
  },
  {
    title: 'Borrels en sociale activiteiten',
    description:
      'Naast alle educatieve activiteiten, vinden we het ook belangrijk om elkaar beter te leren kennen. Na ieder evenement praten we altijd nog even na met een drankje, en door het jaar heen organiseren we meerdere borrels en andere sociale activiteiten om een gezellige sfeer binnen de vereniging te creëren en te behouden.',
  },
  {
    title: 'MF Reis',
    description:
      'Eens in het jaar organiseren we een reis van enkele dagen speciaal voor onze leden, meestal met een Europese stad als bestemming. In de afgelopen jaren zijn we bijvoorbeeld meerdere dagen naar Lissabon en Budapest geweest.',
  },
]

export default function EventsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-cream pt-24">
        <section className="px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 font-serif text-5xl font-medium tracking-tight text-navy lg:text-6xl">
              Events
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Naast de maandelijkse meetings worden er door het jaar heen diverse andere
              activiteiten georganiseerd, zowel op educatief als sociaal vlak.
            </p>
          </div>
        </section>
        <section className="px-6 pb-24 lg:px-12">
          <div className="mx-auto max-w-4xl space-y-16">
            {eventCategories.map((category, index) => (
              <article key={index} className="border-t border-line pt-8">
                <h2 className="mb-4 font-serif text-2xl font-medium text-navy lg:text-3xl">
                  {category.title}
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {category.description}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="bg-navy px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 font-serif text-3xl font-medium text-cream lg:text-4xl">
              Interesse in onze events?
            </h2>
            <p className="mb-8 text-cream/70">
              Word lid van Mutual Fund en krijg toegang tot al onze activiteiten.
            </p>
            <a
              href="/#contact"
              className="inline-block bg-gold px-8 py-3 text-sm font-semibold uppercase tracking-wider text-navy"
            >
              Word lid
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
