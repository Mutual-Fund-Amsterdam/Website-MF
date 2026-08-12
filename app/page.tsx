import { Navigation } from '../components/navigation'
import { Hero } from '../components/hero'
import { Stats } from '../components/stats'
import { Pillars } from '../components/pillars'
import { Board } from '../components/board'
import { Testimonial } from '../components/testimonial'
import { Partners } from '../components/partners'
import { Steps } from '../components/steps'
import { Contact } from '../components/contact'
import { Footer } from '../components/footer'

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Stats />
        <Pillars />
        <Board />
        <Testimonial />
        <Partners />
        <Steps />
        <Contact />
      </main>
      <Footer />
    </>
  )
}