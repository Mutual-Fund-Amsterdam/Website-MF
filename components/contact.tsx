'use client'

import { ArrowRight } from 'lucide-react'

export function Contact({ compact = false }: { compact?: boolean }) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '')
    const email = String(formData.get('email') ?? '')
    const subject = String(formData.get('subject') ?? 'Algemene vraag')
    const message = String(formData.get('message') ?? '')
    const mailSubject = encodeURIComponent(`Contact Mutual Fund — ${subject} — ${name}`)
    const body = encodeURIComponent(`Naam: ${name}\nE-mailadres: ${email}\nOnderwerp: ${subject}\n\nBericht:\n${message}`)
    window.location.href = `mailto:secretaris@mutualfund.nl?subject=${mailSubject}&body=${body}`
  }

  return (
    <section className={`contact-block ${compact ? 'contact-block--compact' : ''}`}>
      <div className="site-container contact-block__grid">
        <div className="contact-block__intro">
          <p className="eyebrow">Direct contact</p>
          <h2>Een gesprek begint met een <em>goede vraag.</em></h2>
          <p>
            Vragen over lidmaatschap, samenwerking of de vereniging? Je bericht wordt gericht aan
            onze secretaris.
          </p>
          <a href="mailto:secretaris@mutualfund.nl">secretaris@mutualfund.nl</a>
          <dl>
            <div><dt>Locatie</dt><dd>Amsterdam</dd></div>
            <div><dt>Reactie</dt><dd>Doorgaans binnen 3 werkdagen</dd></div>
          </dl>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="contact-form__row">
            <label>
              <span>Naam</span>
              <input required name="name" type="text" autoComplete="name" placeholder="Voor- en achternaam" />
            </label>
            <label>
              <span>E-mailadres</span>
              <input required name="email" type="email" autoComplete="email" placeholder="naam@email.nl" />
            </label>
          </div>
          <label>
            <span>Onderwerp</span>
            <select name="subject" defaultValue="Lidmaatschap">
              <option>Lidmaatschap</option>
              <option>Partnerschap</option>
              <option>Pers</option>
              <option>Algemene vraag</option>
            </select>
          </label>
          <label>
            <span>Bericht</span>
            <textarea required name="message" rows={5} placeholder="Vertel ons waarmee we kunnen helpen" />
          </label>
          <button type="submit" className="button button--gold">
            Open e-mailbericht <ArrowRight size={17} aria-hidden="true" />
          </button>
          <small>Het formulier opent je eigen e-mailprogramma; er worden hier geen gegevens opgeslagen.</small>
        </form>
      </div>
    </section>
  )
}
