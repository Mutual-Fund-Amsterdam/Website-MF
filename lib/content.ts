export const boardMembers = [
  {
    name: 'Bryan Berlijn',
    role: 'Voorzitter',
    email: 'voorzitter@mutualfund.nl',
    image: '/board/lucas-ham.webp',
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
    image: '/board/bryan-berlijn.webp',
    linkedin: 'https://www.linkedin.com/in/lucasham/',
  },
  {
    name: 'Florian van Heest',
    role: 'Algemeen bestuurslid',
    email: 'commissaris@mutualfund.nl',
    image: '/board/florian-van-heest.webp',
    linkedin: 'https://www.linkedin.com/in/florian-van-heest/',
  },
] as const

export const partnerLogos = [
  { name: 'J.P. Morgan', src: '/partners/logos/jpmorgan.svg', url: 'https://www.jpmorgan.com' },
  { name: 'Egeria', src: '/partners/logos/egeria.svg', url: 'https://egeriagroup.com' },
  { name: 'FSA', src: '/partners/logos/fsa.svg', url: 'https://fsa.nl' },
  { name: 'IBS Capital Allies', src: '/partners/logos/ibs.svg', url: 'https://ibsca.nl/en/' },
  { name: 'LYNX', src: '/partners/logos/lynx.svg', url: 'https://www.lynx.nl' },
  { name: 'Teslin', src: '/partners/logos/teslin.svg', url: 'https://www.teslin.nl' },
  { name: 'FactSet', src: '/partners/logos/factset.webp', url: 'https://www.factset.com' },
  { name: 'Photon Capital', src: '/partners/logos/photon-capital.webp', url: 'https://photoncapital.com' },
  {
    name: 'SilverCross Investment Management',
    src: '/partners/logos/silvercross.webp',
    url: 'https://silvercross-im.com',
  },
  { name: 'DUFAS', src: '/partners/logos/dufas.webp', url: 'https://dufas.nl' },
  { name: 'Add Value Fund', src: '/partners/logos/add-value-fund.webp', url: 'https://addvaluefund.nl' },
  { name: 'B&R Beurs', src: '/partners/logos/bnr-beurs.webp', url: 'https://bnrbeurs.nl/' },
] as const

export const programItems = [
  { time: '19:00', description: 'Start maandelijkse meeting' },
  { time: '19:15', description: 'Macro-economische update door de Macro-commissie' },
  { time: '19:30', description: "Tell Me Something I Don’t Know" },
  { time: '20:15', description: 'Pauze' },
  { time: '20:45', description: 'Afzonderlijke fondsbesprekingen — Fonds 1, 2 & 3' },
  { time: '22:00', description: 'Afsluitende borrel op externe locatie' },
] as const

export const eventCategories = [
  {
    index: '01',
    title: 'Trainingen en workshops',
    label: 'Vaardigheden',
    description:
      'Regelmatig organiseren we trainingen en workshops om de hard skills die belangrijk zijn binnen de financiële sector bij te brengen aan onze leden. Denk aan het waarderen van bedrijven met financiële modellen als de DCF, of werken met veelgebruikte software als FactSet. Zo breiden leden hun vaardigheden uit en bereiden zij zich voor op een carrière binnen de financiële sector.',
  },
  {
    index: '02',
    title: 'Inhousedagen',
    label: 'Netwerk',
    description:
      'In de afgelopen jaren zijn meerdere inhousedagen bij partners van Mutual Fund georganiseerd. Voorbeelden zijn de Waterland Investment Services Caseday, de IEX Media Caseday en de IBS Capital Allies Inhousedag.',
  },
  {
    index: '03',
    title: 'Borrels en sociale activiteiten',
    label: 'Community',
    description:
      'Naast alle educatieve activiteiten vinden we het belangrijk elkaar beter te leren kennen. Na ieder evenement praten we na met een drankje. Door het jaar heen organiseren we meerdere borrels en sociale activiteiten om de hechte sfeer binnen de vereniging te behouden.',
  },
  {
    index: '04',
    title: 'MF Reis',
    label: 'Internationaal',
    description:
      'Eens per jaar organiseren we een meerdaagse reis speciaal voor onze leden, meestal met een Europese stad als bestemming. In de afgelopen jaren bezochten we onder meer Lissabon en Boedapest.',
  },
] as const

export const newsItems = [
  {
    category: 'Mijlpaal',
    title: 'MF opent beurs 16 juni',
    excerpt: 'Een historisch moment voor de vereniging: we openen de beursdag bij Euronext Amsterdam.',
    date: '16 juni 2026',
    href: '#',
    featured: true,
  },
  {
    category: 'Reis',
    title: 'MF reis Milaan',
    excerpt: 'Alles over onze aanstaande studiereis naar het financiële hart van Italië.',
    date: 'Binnenkort',
    href: '#',
    featured: false,
  },
] as const

export const publications = [
  {
    outlet: 'Nieuwsuur NOS',
    title: 'Hoge beurskoersen terwijl de wereld in brand staat',
    date: '2026',
    href: 'https://nos.nl/nieuwsuur/video/2598071-hoge-beurskoersen-terwijl-de-wereld-in-brand-staat',
  },
  {
    outlet: 'de Volkskrant',
    title: 'Deze jonge investeerders oefenen voor later',
    date: '2025',
    href: 'https://www.volkskrant.nl/economie/deze-jonge-investeerders-oefenen-voor-later-hoe-eerder-je-begint-hoe-meer-vermogen-je-opbouwt~b0127cd9/',
  },
  {
    outlet: 'Het Parool',
    title: 'Crisis? Voor de studenten van deze beleggingsclub zijn het mooie tijden: ‘Gewoon rustig blijven’',
    date: '2025',
    href: 'https://www.parool.nl/amsterdam/crisis-voor-de-studenten-van-deze-beleggingsclub-zijn-het-mooie-tijden-gewoon-rustig-blijven~b885bbd7/',
  },
  { outlet: 'Beleggers Belangen', title: 'Studentenbeleggers van Mutual Fund', date: '2023', href: '#' },
  {
    outlet: 'Het Financieele Dagblad',
    title: 'Amsterdamse studenten beheren eigen beleggingsfonds',
    date: '2022',
    href: '#',
  },
  {
    outlet: 'Het Parool',
    title: 'Mutual Fund: waar studenten leren beleggen met echt geld',
    date: '2021',
    href: '#',
  },
  {
    outlet: 'Het Parool',
    title: 'Beleggingsclubjes: eerst beleggen en dan door naar de kroeg',
    date: '2020',
    href: 'https://www.parool.nl/ps/beleggingsclubjes-eerst-beleggen-en-dan-door-naar-de-kroeg~bd92a06c/',
  },
  {
    outlet: 'De Telegraaf',
    title: 'Jonge beleggers zien kansen ondanks turbulente markten',
    date: '2020',
    href: '#',
  },
] as const

export const associationStats = [
  { value: '2010', label: 'Opgericht' },
  { value: '80+', label: 'Actieve studenten' },
  { value: '3', label: 'Beleggingsfondsen' },
  { value: '€500', label: 'Inleg per lid' },
] as const
