import Image from 'next/image'

const members = [
  {
    name: 'Bryan Berlijn',
    role: 'Voorzitter',
    email: 'voorzitter@mutualfund.nl',
    image: '/board/bryan-berlijn.webp',
    linkedin: 'https://www.linkedin.com/in/bryan-berlijn/',
  },
  {
    name: 'Annemijn Hekelaar Gombert',
    role: 'Secretaris',
    email: 'secretaris@mutualfund.nl',
    image: '/board/annemijn-hekelaar-gombert.webp',
    linkedin: 'https://www.linkedin.com/in/annemijn-hekelaar-gombert-29a075211/',
  },
  {
    name: 'Lucas Ham',
    role: 'Penningmeester',
    email: 'penningmeester@mutualfund.nl',
    image: '/board/lucas-ham.webp',
    linkedin: 'https://www.linkedin.com/in/lucasham/',
  },
  {
    name: 'Florian van Heest',
    role: 'Algemeen bestuurslid',
    email: 'commissaris@mutualfund.nl',
    image: '/board/florian-van-heest.webp',
    linkedin: 'https://www.linkedin.com/in/florian-van-heest/',
  },
]

export function Board() {
  return (
    <section id="bestuur" className="bg-cream-light px-6 py-[120px] md:px-12">
      <div className="mx-auto mb-[72px] grid max-w-7xl items-end gap-6 md:grid-cols-[1fr_2fr] md:gap-16">
        <h2 className="font-serif text-5xl leading-[1.05] tracking-tight text-navy md:text-7xl">
          Het <em className="font-normal text-gold">bestuur.</em>
        </h2>
        <p className="max-w-3xl text-lg leading-relaxed text-navy/70 md:text-xl">
          Vier studenten dragen de organisatorische verantwoordelijkheid. Bereikbaar, betrokken en
          aanspreekbaar voor leden en geïnteresseerden.
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((member) => (
          <div key={member.name}>
            <div className="relative mb-6 aspect-square overflow-hidden rounded-full bg-cream-light">
              <Image
                src={member.image}
                alt={member.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover grayscale"
              />
            </div>
            <h3 className="mb-2 font-serif text-2xl font-medium text-navy">{member.name}</h3>
            <div className="mb-5 text-sm font-medium uppercase tracking-wide text-gold">{member.role}</div>
            <div className="flex gap-3 text-sm">
              <a
                href={`mailto:${member.email}`}
                className="text-navy/70 transition-colors hover:text-navy"
              >
                E-mail
              </a>
              <a
                href={member.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-navy/70 transition-colors hover:text-navy"
              >
                LinkedIn
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
