import { Navigation } from '../../components/navigation'
import { Footer } from '../../components/footer'
import { Skeleton } from '../../components/ui/skeleton'

export default function NieuwsLoading() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-cream pt-32 pb-24">
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          {/* Dit is het skelet voor de grote titel */}
          <div className="mb-16 space-y-4">
            <Skeleton className="h-4 w-24 bg-gold/20" />
            <Skeleton className="h-12 w-64 bg-line" />
            <Skeleton className="h-20 w-full max-w-2xl bg-line" />
          </div>
          
          {/* Dit is het skelet voor de nieuws-kaartjes */}
          <div className="grid gap-8 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`border border-line bg-cream-light p-8 ${i === 1 ? 'md:col-span-2' : ''}`}>
                <Skeleton className="mb-4 h-6 w-32 bg-line" />
                <Skeleton className="mb-4 h-8 w-3/4 bg-line" />
                <Skeleton className="mb-6 h-16 w-full bg-line" />
                <Skeleton className="h-5 w-24 bg-line" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
