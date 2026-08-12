import type { Metadata } from 'next'
import { PageHero } from '../../components/page-hero'
import { Contact } from '../../components/contact'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Neem contact op met Mutual Fund over lidmaatschap, partnerships of persvragen.',
}

export default function ContactPage() {
  return (
    <main id="main-content">
      <PageHero
        index="07 / 07"
        eyebrow="Contact"
        title={<>Een goed netwerk begint met <em>contact.</em></>}
        description="Of je nu student, organisatie, alumnus of journalist bent: laat ons weten waarmee we kunnen helpen."
      />
      <Contact />
    </main>
  )
}
