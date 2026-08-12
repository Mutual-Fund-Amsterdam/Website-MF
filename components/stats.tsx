'use client'

import { useEffect, useRef, useState } from 'react'

const stats = [
  { from: 2006, to: 2010, suffix: '', label: 'Opgericht' },
  { from: 0, to: 3, suffix: '', label: 'Fondsen' },
  { from: 0, to: 100, suffix: '+', label: 'Alumni' },
  { from: 0, to: 80, suffix: '+', label: 'Studenten' },
]

function Counter({ from, to, suffix, duration = 1500 }: { from: number; to: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(from)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const steps = 60
    const increment = (to - from) / steps
    const interval = duration / steps
    let current = from
    let step = 0
    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setCount(to)
        clearInterval(timer)
      } else {
        setCount(Math.round(current))
      }
    }, interval)
    return () => clearInterval(timer)
  }, [started, from, to, duration])

  return (
    <div ref={ref} className="stat-counter">
      {count}{suffix}
    </div>
  )
}

export function Stats() {
  return (
    <div className="bg-navy text-cream relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-px bg-gold" />
      <div className="grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center justify-center py-16 px-6 text-center border-r border-cream/10 last:border-r-0">
            <div className="font-serif font-light text-[64px] leading-none tracking-tight text-gold mb-3">
              <Counter from={stat.from} to={stat.to} suffix={stat.suffix} />
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-cream/60">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
