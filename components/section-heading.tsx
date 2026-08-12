import type { ReactNode } from 'react'

type SectionHeadingProps = {
  eyebrow: string
  title: ReactNode
  description?: string
  inverted?: boolean
  align?: 'left' | 'split'
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  inverted = false,
  align = 'split',
}: SectionHeadingProps) {
  return (
    <div
      className={`section-heading ${align === 'left' ? 'section-heading--left' : ''} ${
        inverted ? 'section-heading--inverted' : ''
      }`}
    >
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="display-title">{title}</h2>
      </div>
      {description ? <p className="section-intro">{description}</p> : null}
    </div>
  )
}
