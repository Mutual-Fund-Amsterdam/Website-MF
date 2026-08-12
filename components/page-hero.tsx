import type { ReactNode } from 'react'

type PageHeroProps = {
  index: string
  eyebrow: string
  title: ReactNode
  description: string
  aside?: ReactNode
}

export function PageHero({ index, eyebrow, title, description, aside }: PageHeroProps) {
  return (
    <header className="page-hero market-grid">
      <div className="site-container relative z-10">
        <div className="page-hero__meta">
          <span>{index}</span>
          <span>{eyebrow}</span>
          <span>AMS</span>
        </div>
        <div className="page-hero__grid">
          <div>
            <h1 className="page-title">{title}</h1>
          </div>
          <div className="page-hero__copy">
            <p>{description}</p>
            {aside ? <div className="mt-8">{aside}</div> : null}
          </div>
        </div>
      </div>
    </header>
  )
}
