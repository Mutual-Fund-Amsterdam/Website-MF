import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Fraunces, Manrope } from 'next/font/google'
import { Toaster } from '../components/ui/toaster' // 👈 1. Importeer de toaster hier
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

// 🎨 Mobiele browserbalk kleur
export const viewport: Viewport = {
  themeColor: '#FAF9F6', 
}

export const metadata: Metadata = {
  title: 'Mutual Fund — Beleggen met passie',
  description: 'Mutual Fund is dé beleggingsvereniging voor financieel georiënteerde studenten in Amsterdam — een educatief platform waar analytisch denken, gezamenlijke besluitvorming en een gedeelde fascinatie voor de markten samenkomen.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  // 📱 Zorgt voor mooie kaartjes bij het delen
  openGraph: {
    title: 'Mutual Fund — Beleggen met passie',
    description: 'Dé beleggingsvereniging voor financieel georiënteerde studenten in Amsterdam.',
    url: 'https://mutualfund.nl',
    siteName: 'Mutual Fund',
    locale: 'nl_NL',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Mutual Fund Amsterdam',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mutual Fund — Beleggen met passie',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // 🪄 scroll-smooth toegevoegd voor vloeiende navigatie
    <html lang="nl" className={`${fraunces.variable} ${manrope.variable} bg-cream scroll-smooth`}>
      <body className="font-sans antialiased leading-relaxed text-ink">
        {children}
        {/* 🍞 2. Zet de Toaster hier neer, net boven Analytics! */}
        <Toaster /> 
        {/* 🧠 Vercel Analytics netjes en clean gehouden */}
        <Analytics />
      </body>
    </html>
  )
}
