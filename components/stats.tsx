import { associationStats } from '../lib/content'

export function Stats() {
  return (
    <section className="stats-band" aria-label="Mutual Fund in cijfers">
      <div className="site-container stats-band__grid">
        {associationStats.map((stat, index) => (
          <div key={stat.label}>
            <span>0{index + 1}</span>
            <strong>{stat.value}</strong>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
