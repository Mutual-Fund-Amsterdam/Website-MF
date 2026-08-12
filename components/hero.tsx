import Link from 'next/link'

export function Hero() {
  return (
    <header className="relative min-h-screen overflow-hidden px-6 pt-[180px] pb-[120px] md:px-12">
      {/* Background gradient */}
      <div className="pointer-events-none absolute top-1/2 -right-[200px] h-[700px] w-[700px] bg-[radial-gradient(circle,rgba(184,146,74,0.08)_0%,transparent_70%)]" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        {/* Content */}
        <div className="relative z-10">
          <div className="mb-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            <span className="h-px w-8 bg-gold" />
            Beleggingsvereniging · sinds 2010
          </div>

          <h1 className="mb-8 font-serif text-[clamp(48px,7vw,92px)] font-normal leading-[0.98] tracking-tight text-navy">
            Beleggen
            <br />
            met <em className="font-light italic text-gold">passie.</em>
          </h1>

          <p className="mb-4 max-w-[480px] text-lg leading-relaxed text-muted-foreground">
            Mutual Fund is dé beleggingsvereniging voor financieel georiënteerde studenten in
            Amsterdam — een educatief platform waar analytisch denken en gezamenlijke besluitvorming
            samenkomen.
          </p>
          <p className="mb-12 font-serif text-sm italic text-gold">
            Wij komen bijeen op iedere tweede woensdag van de maand.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="#about"
              className="group inline-flex items-center gap-2.5 rounded-sm bg-navy px-8 py-4 text-sm font-semibold tracking-wide text-cream transition-all hover:-translate-y-0.5 hover:bg-navy-deep"
            >
              Ontdek Mutual Fund
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="#contact"
              className="inline-flex items-center gap-2.5 rounded-sm border border-navy bg-transparent px-8 py-4 text-sm font-semibold tracking-wide text-navy transition-colors hover:bg-navy hover:text-cream"
            >
              Word lid
            </Link>
          </div>
        </div>

        {/* Stille, doorlopende sfeerimpressie */}
        <aside className="relative z-10 lg:pl-4">
          <div className="pointer-events-none absolute -inset-3 border border-gold/20" />
          <div className="pointer-events-none relative aspect-video w-full overflow-hidden border border-gold/30 bg-navy shadow-[0_28px_70px_rgba(14,32,57,0.16)]">
            <iframe
              className="h-full w-full scale-[1.03]"
              src="https://www.youtube.com/embed/5cAZ-VM_MpQ?autoplay=1&mute=1&controls=0&loop=1&playlist=5cAZ-VM_MpQ&playsinline=1&rel=0&disablekb=1"
              title="Sfeerimpressie van Mutual Fund"
              allow="autoplay; encrypted-media; picture-in-picture"
              tabIndex={-1}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/25 via-transparent to-cream/5" />
            <div className="absolute bottom-0 left-0 h-px w-24 bg-gold" />
          </div>
        </aside>
      </div>
    </header>
  )
}
