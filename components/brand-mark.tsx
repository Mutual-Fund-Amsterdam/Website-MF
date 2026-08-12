import Link from 'next/link'

export function BrandMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Mutual Fund — homepage"
      className={`group inline-flex items-center gap-3 ${inverted ? 'text-cream' : 'text-navy'}`}
    >
      <span
        aria-hidden="true"
        className={`relative grid h-9 w-9 place-items-center border text-[10px] font-bold tracking-[0.08em] transition-colors ${
          inverted
            ? 'border-cream/25 bg-cream/[0.04] text-gold-soft group-hover:border-gold/70'
            : 'border-navy/20 bg-navy/[0.03] text-gold group-hover:border-gold'
        }`}
      >
        MF
        <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-l border-t border-gold bg-current/0" />
      </span>
      <span className="font-serif text-[21px] font-medium leading-none tracking-[-0.035em]">
        Mutual <em className="font-light text-gold">Fund</em>
      </span>
    </Link>
  )
}
