import Link from 'next/link'
import { Navigation } from '../../components/navigation'
import { Footer } from '../../components/footer'

export const metadata = {
  title: 'Nieuws & Updates - Mutual Fund',
  description: 'Blijf op de hoogte van de laatste nieuwtjes en reizen van Mutual Fund.',
}

// 📰 Twee beknopte items zoals gevraagd!
const newsItems = [
  {
    category: 'Mijlpaal',
    title: 'MF opent beurs 16 juni',
    excerpt: 'Een historisch moment voor de vereniging: we openen de beursdag bij Euronext Amsterdam.',
    date: '16 Juni 2026',
    slug: '#', // Linkt voor nu nergens heen
    featured: true,
  },
  {
    category: 'Reis',
    title: 'MF reis Milaan',
    excerpt: 'Alles over onze aanstaande studiereis naar het financiële hart van Italië.',
    date: 'Binnenkort',
    slug: '#', // Linkt voor nu nergens heen
    featured: false,
  },
]

export default function NieuwsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-cream pt-32 pb-24">
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          
          <div className="mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Updates
            </p>
            <h1 className="mb-6 font-serif text-4xl font-medium tracking-tight text-navy md:text-5xl">
              Nieuws & Verhalen
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Een kijkje achter de schermen bij Mutual Fund. Van bijzondere mijlpalen tot onze internationale studiereizen.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {newsItems.map((item, index) => (
              <Link 
                key={index} 
                href={item.slug}
                className={`group flex flex-col justify-between border border-line bg-cream-light p-8 transition-all hover:-translate-y-1 hover:shadow-lg ${
                  item.featured ? 'md:col-span-2 md:flex-row md:items-center md:gap-12' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
                      {item.category}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {item.date}
                    </span>
                  </div>
                  
                  <h2 className="mb-4 font-serif text-2xl font-medium text-navy transition-colors group-hover:text-gold md:text-3xl">
                    {item.title}
                  </h2>
                  
                  <p className="mb-6 leading-relaxed text-muted-foreground">
                    {item.excerpt}
                  </p>
                </div>

                <div className="mt-auto flex items-center font-medium text-navy group-hover:text-gold transition-colors md:mt-0">
                  <span className="mr-2">Lees verder</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 transition-transform group-hover:translate-x-1">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
