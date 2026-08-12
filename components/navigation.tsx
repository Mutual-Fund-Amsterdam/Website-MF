'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BarChart3, Menu, X } from 'lucide-react'
import { BrandMark } from './brand-mark'

const navigation = [
  { label: 'Over ons', href: '/over-ons' },
  { label: 'Bestuur', href: '/bestuur' },
  { label: 'Partners', href: '/partners' },
  { label: 'Events', href: '/events' },
  { label: 'Nieuws', href: '/nieuws' },
]

export function Navigation() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  function openMarket() {
    window.dispatchEvent(new Event('mutualfund:market-open'))
  }

  return (
    <header className={`site-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="site-nav__inner">
        <BrandMark inverted />

        <nav className="site-nav__desktop" aria-label="Hoofdnavigatie">
          {navigation.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="site-nav__actions">
          <button type="button" className="market-indicator" onClick={openMarket} aria-label="Open de AEX-weergave">
            <BarChart3 size={15} aria-hidden="true" />
            <span>AEX</span>
            <i aria-hidden="true" />
          </button>
          <Link href="/contact" className="nav-contact">Contact</Link>
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? 'Sluit navigatiemenu' : 'Open navigatiemenu'}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div id="mobile-navigation" className="mobile-nav" data-open={menuOpen ? 'true' : 'false'}>
        <nav aria-label="Mobiele navigatie">
          <Link href="/"><span>00</span>Home</Link>
          {navigation.map((item, index) => (
            <Link key={item.href} href={item.href}>
              <span>0{index + 1}</span>
              {item.label}
            </Link>
          ))}
          <Link href="/pers"><span>06</span>Pers</Link>
          <Link href="/contact"><span>07</span>Contact</Link>
        </nav>
        <div className="mobile-nav__footer">
          <p>Beleggingsvereniging voor studenten in Amsterdam.</p>
          <button type="button" onClick={openMarket}>Open AEX-overzicht</button>
        </div>
      </div>
    </header>
  )
}
