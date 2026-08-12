export default function NieuwsLoading() {
  return (
    <main id="main-content" className="min-h-screen bg-cream pt-32 pb-24" aria-busy="true">
      <div className="site-container">
        <div className="h-3 w-28 animate-pulse bg-gold/20" />
        <div className="mt-8 h-20 max-w-3xl animate-pulse bg-line" />
        <div className="mt-20 grid gap-px bg-line md:grid-cols-2">
          <div className="h-[420px] animate-pulse bg-cream-light" />
          <div className="h-[420px] animate-pulse bg-cream-light" />
        </div>
      </div>
    </main>
  )
}
