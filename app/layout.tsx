import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Fraunces, Manrope } from 'next/font/google'
import { Navigation } from '../components/navigation'
import { Footer } from '../components/footer'
import { MarketGate } from '../components/market-gate'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#061429',
  colorScheme: 'dark light',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://website-mf.vercel.app'),
  title: {
    default: 'Mutual Fund — Beleggen met overtuiging',
    template: '%s — Mutual Fund',
  },
  description:
    'Mutual Fund is de Amsterdamse beleggingsvereniging waar studenten met echt kapitaal beleggen, financiële markten analyseren en een professioneel netwerk opbouwen.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Mutual Fund — Beleggen met overtuiging',
    description: 'Beleggingsvereniging voor financieel georiënteerde studenten in Amsterdam.',
    url: '/',
    siteName: 'Mutual Fund',
    locale: 'nl_NL',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Mutual Fund — Beleggen met overtuiging',
    description: 'Beleggingsvereniging voor financieel georiënteerde studenten in Amsterdam.',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Ga naar de inhoud</a>
        <MarketGate />
        <Navigation />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
