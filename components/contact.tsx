'use client'

export function Contact() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const name = String(formData.get('name') ?? '')
    const email = String(formData.get('email') ?? '')
    const message = String(formData.get('message') ?? '')
    const subject = encodeURIComponent(`Contactformulier Mutual Fund — ${name}`)
    const body = encodeURIComponent(
      `Naam: ${name}\nE-mailadres: ${email}\n\nBericht:\n${message}`
    )

    window.location.href =
      `mailto:secretaris@mutualfund.nl?subject=${subject}&body=${body}`
  }

  return (
    <section id="contact" className="bg-cream py-24 border-t border-line">
      <div className="mx-auto max-w-3xl px-6 md:px-12 text-center">
        <h2 className="mb-6 font-serif text-3xl font-medium text-navy md:text-4xl">Kom in contact</h2>
        <p className="mb-12 text-lg text-muted-foreground">
          Vragen over het lidmaatschap of interesse in een samenwerking? Je bericht wordt gericht
          aan{' '}
          <a
            href="mailto:secretaris@mutualfund.nl"
            className="text-navy underline decoration-gold underline-offset-4"
          >
            secretaris@mutualfund.nl
          </a>
          .
        </p>

        <form onSubmit={handleSubmit} className="text-left space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-navy">Naam</label>
              <input required type="text" id="name" name="name" autoComplete="name" className="w-full rounded-none border border-line bg-cream-light px-4 py-3 text-ink focus:border-gold focus:outline-none" />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-navy">E-mailadres</label>
              <input required type="email" id="email" name="email" autoComplete="email" className="w-full rounded-none border border-line bg-cream-light px-4 py-3 text-ink focus:border-gold focus:outline-none" />
            </div>
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block text-sm font-medium text-navy">Bericht</label>
            <textarea required id="message" name="message" rows={5} className="w-full rounded-none border border-line bg-cream-light px-4 py-3 text-ink focus:border-gold focus:outline-none"></textarea>
          </div>
          <button 
            type="submit" 
            className="w-full bg-navy px-6 py-4 text-sm font-medium text-cream transition-colors hover:bg-navy/90"
          >
            Verstuur bericht
          </button>
        </form>
      </div>
    </section>
  )
}
