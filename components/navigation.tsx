'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 backdrop-blur-md bg-cream/85 transition-colors duration-300 md:px-12 ${
        scrolled ? 'border-b border-line' : 'border-b border-transparent'
      }`}
    >
      <Link href="/" className="font-serif font-medium text-[22px] tracking-tight text-navy">
        Mutual <span className="text-gold italic">Fund</span>
      </Link>

      <ul className="hidden items-center gap-9 lg:flex">
        <li>
          <Link
            href="/over-ons"
            className="text-sm font-medium text-ink transition-colors hover:text-gold"
          >
            Over ons
          </Link>
        </li>
        <li>
          <Link
            href="/#bestuur"
            className="text-sm font-medium text-ink transition-colors hover:text-gold"
          >
            Bestuur
          </Link>
        </li>
        <li>
          <Link
            href="/#partners"
            className="text-sm font-medium text-ink transition-colors hover:text-gold"
          >
            Partners
          </Link>
        </li>
        <li>
          <Link
            href="/events"
            className="text-sm font-medium text-ink transition-colors hover:text-gold"
          >
            Events
          </Link>
        </li>
        {/* 👇 Hier is de nieuwe link toegevoegd! */}
        <li>
          <Link
            href="/nieuws"
            className="text-sm font-medium text-ink transition-colors hover:text-gold"
          >
            Nieuws
          </Link>
        </li>
        <li>
          <Link
            href="/#contact"
            className="px-5 py-2.5 bg-navy text-cream text-sm font-medium rounded-sm transition-colors hover:bg-navy-deep"
          >
            Contact
          </Link>
        </li>
      </ul>
    </nav>
  )
}
