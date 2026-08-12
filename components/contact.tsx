'use client'

import { useState } from 'react'
import { useToast } from '../hooks/use-toast'

export function Contact() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // We simuleren een verzending van 1 seconde
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Bericht succesvol verzonden! 🚀",
        description: "Bedankt voor je interesse in Mutual Fund. We nemen snel contact met je op.",
      })
      // Maakt het formulier na verzending netjes leeg
      ;(e.target as HTMLFormElement).reset()
    }, 1000)
  }

  return (
    <section id="contact" className="bg-cream py-24 border-t border-line">
      <div className="mx-auto max-w-3xl px-6 md:px-12 text-center">
        <h2 className="mb-6 font-serif text-3xl font-medium text-navy md:text-4xl">Kom in contact</h2>
        <p className="mb-12 text-lg text-muted-foreground">
          Vragen over het lidmaatschap of interesse in een samenwerking? Laat een bericht achter.
        </p>

        <form onSubmit={handleSubmit} className="text-left space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-navy">Naam</label>
              <input required type="text" id="name" className="w-full rounded-none border border-line bg-cream-light px-4 py-3 text-ink focus:border-gold focus:outline-none" />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-navy">E-mailadres</label>
              <input required type="email" id="email" className="w-full rounded-none border border-line bg-cream-light px-4 py-3 text-ink focus:border-gold focus:outline-none" />
            </div>
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block text-sm font-medium text-navy">Bericht</label>
            <textarea required id="message" rows={5} className="w-full rounded-none border border-line bg-cream-light px-4 py-3 text-ink focus:border-gold focus:outline-none"></textarea>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-navy px-6 py-4 text-sm font-medium text-cream transition-colors hover:bg-navy/90 disabled:opacity-70"
          >
            {isSubmitting ? 'Verzenden...' : 'Verstuur bericht'}
          </button>
        </form>
      </div>
    </section>
  )
}
