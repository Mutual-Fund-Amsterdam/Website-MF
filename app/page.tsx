import { Hero } from '../components/hero'
import { Stats } from '../components/stats'
import { Pillars } from '../components/pillars'
import { Board } from '../components/board'
import { Testimonial } from '../components/testimonial'
import { Partners } from '../components/partners'
import { Steps } from '../components/steps'
import { Contact } from '../components/contact'

export default function HomePage() {
  return (
    <main id="main-content">
      <Hero />
      <Stats />
      <Pillars />
      <Board />
      <Testimonial />
      <Partners limit={8} />
      <Steps />
      <Contact compact />
    </main>
  )
}
