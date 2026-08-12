import Image from 'next/image'

const members = [
  {
    name: 'Bas Morelissen',
    role: 'Voorzitter',
    email: 'voorzitter@mutualfund.nl',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bas-500x500-XzwwYiFKKDfNEBJg52sQ53WoxZWLkw.png',
  },
  {
    name: 'Pieter van der Zijden',
    role: 'Secretaris',
    email: 'secretaris@mutualfund.nl',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pieter-500x500-U1J4492U8dR33HaSt7aayP2Tep8YBJ.png',
  },
  {
    name: 'Tom Arends',
    role: 'Penningmeester',
    email: 'penningmeester@mutualfund.nl',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tom-500x500-UTB4kMzTIJwovNrdlsO3M2owLkY7TN.png',
  },
  {
    name: 'Sander van Dijk',
    role: 'Algemeen bestuurslid',
    email: 'commissaris@mutualfund.nl',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sander-500x500-TadSmLxuZU7PHfRtuOJRMnllenPl9Y.png',
  },
]

export function Board() {
  return (
    <section id="bestuur" className="bg-cream-light px-6 py-[120px] md:px-12">
      {/* Section Header */}
      <div className="mx-auto mb-[72px] grid max-w-7xl items-end gap-6 md:grid-cols-[1fr_2fr] md:gap-16">
        <h2 className="font-serif text-[clamp(36px,4.5vw,56px)] font-normal leading-[1.05] tracking-tight text-navy">
          Het <em className="font-light italic text-gold">bestuur.</em>
        </h2>
        <p className="max-w-[540px] text-base leading-relaxed text-muted-foreground">
          Vier studenten dragen de organisatorische verantwoordelijkheid. Bereikbaar, betrokken en
          aanspreekbaar voor leden en geïnteresseerden.
        </p>
      </div>

      {/* Board Grid */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((member) => (
          <div key={member.name} className="flex flex-col">
            {/* Member Photo */}
            <div className="relative mb-6 aspect-square overflow-hidden rounded-full">
              <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover"
              />
            </div>

            <h3 className="mb-1 font-serif text-[22px] font-medium text-navy">{member.name}</h3>
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.06em] text-gold">
              {member.role}
            </div>
            <div className="flex gap-3 text-sm">
              <a
                href={`mailto:${member.email}`}
                className="text-muted-foreground transition-colors hover:text-navy"
              >
                E-mail
              </a>
              <a href="#" className="text-muted-foreground transition-colors hover:text-navy">
                LinkedIn
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
