const pillars = [
  {
    num: '01',
    title: 'Maandelijkse evaluatie',
    description:
      'Iedere positie in de portefeuille wordt maandelijks doorgelicht aan de hand van rendement, vooruitzichten en relevant nieuws. Geen aandeel ontsnapt aan de discussie.',
  },
  {
    num: '02',
    title: 'Buy- en sell-pitches',
    description:
      'Leden presenteren onderbouwde pitches voor toevoegingen of verkopen. De vereniging stemt — democratisch, kritisch, met diepgang.',
  },
  {
    num: '03',
    title: 'Drie fondsen, één competitie',
    description:
      'Wij beheren drie fondsen die onderling concurreren op rendement — een gezonde rivaliteit die leden scherp houdt en de analyse aanscherpt.',
  },
]

export function Pillars() {
  return (
    <section id="about" className="px-6 py-[120px] md:px-12">
      {/* Section Header */}
      <div className="mx-auto mb-[72px] grid max-w-7xl items-end gap-6 md:grid-cols-[1fr_2fr] md:gap-16">
        <h2 className="font-serif text-[clamp(36px,4.5vw,56px)] font-normal leading-[1.05] tracking-tight text-navy">
          Wat we <em className="font-light italic text-gold">doen.</em>
        </h2>
        <p className="max-w-[540px] text-base leading-relaxed text-muted-foreground">
          Een gedeeld kapitaal, een gedeelde verantwoordelijkheid. Onze leden leggen samen in en
          beslissen samen — over elke positie wordt gestemd na zorgvuldige analyse.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px border border-line bg-line md:grid-cols-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.num}
            className="bg-cream-light p-10 transition-colors hover:bg-cream md:p-14"
          >
            <div className="mb-6 font-serif text-sm italic text-gold">— {pillar.num}</div>
            <h3 className="mb-4 font-serif text-[26px] font-medium leading-tight tracking-tight text-navy">
              {pillar.title}
            </h3>
            <p className="text-[15px] leading-relaxed text-muted-foreground">{pillar.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
