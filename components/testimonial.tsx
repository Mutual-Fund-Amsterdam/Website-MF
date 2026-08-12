export function Testimonial() {
  return (
    <section className="bg-navy px-6 py-[140px] text-cream md:px-12">
      <div className="mx-auto max-w-[900px] text-center">
        <span className="mb-6 block font-serif text-[120px] italic leading-[0.5] text-gold">
          &ldquo;
        </span>
        <blockquote className="mb-10 font-serif text-[clamp(24px,3vw,34px)] font-light italic leading-snug tracking-tight">
          Mijn tijd bij het Mutual Fund heeft mij doen realiseren dat er meer komt kijken bij het
          analyseren van financiële instrumenten dan de student wordt aangeleerd tijdens de studie.
          Die ervaring heeft significant bijgedragen aan een succesvolle stage in investment
          banking.
        </blockquote>
        <cite className="not-italic">
          <strong className="mb-1 block font-serif text-lg font-medium text-cream">
            Sebastian Bong
          </strong>
          <span className="text-sm uppercase tracking-[0.08em] text-gold-soft">
            Société Générale
          </span>
        </cite>
      </div>
    </section>
  )
}
