const steps = [
  {
    num: '01',
    title: 'Verken de vereniging',
    description:
      'Lees op deze site over onze werkwijze, het bestuur en onze partners. Bekijk hoe wij beleggen en wat de vereniging onderscheidt.',
  },
  {
    num: '02',
    title: 'Solliciteer in september of februari',
    description:
      'Onze sollicitatierondes vinden tweemaal per jaar plaats. Stuur in een van deze maanden je motivatiebrief en CV naar het secretariaat.',
  },
  {
    num: '03',
    title: 'Sluit aan bij een meeting',
    description:
      'Tijdens een proefmeeting maak je kennis met de leden, de portefeuille en onze manier van analyseren en stemmen.',
  },
]

export function Steps() {
  return (
    <section className="bg-cream-light px-6 py-[120px] md:px-12">
      {/* Section Header */}
      <div className="mx-auto mb-[72px] grid max-w-7xl items-end gap-6 md:grid-cols-[1fr_2fr] md:gap-16">
        <h2 className="font-serif text-[clamp(36px,4.5vw,56px)] font-normal leading-[1.05] tracking-tight text-navy">
          Lid <em className="font-light italic text-gold">worden.</em>
        </h2>
        <p className="max-w-[540px] text-base leading-relaxed text-muted-foreground">
          Geïnteresseerd in deelname? Drie stappen scheiden je van een plek aan tafel bij de
          eerstvolgende meeting.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.num}>
            <div className="mb-6 font-serif text-[80px] font-light leading-none tracking-tighter text-gold">
              {step.num}
            </div>
            <h3 className="mb-3 font-serif text-2xl font-medium tracking-tight text-navy">
              {step.title}
            </h3>
            <p className="text-[15px] leading-relaxed text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
