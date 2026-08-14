export type BlogCategory = "Meeting" | "Reis" | "Event" | "Pitch" | "Pers";

export type BlogPost = {
  title: string;
  slug: string;
  date: string;
  displayDate: string;
  category: BlogCategory;
  cover: string;
  excerpt: string;
  body: string[];
  source?: {
    outlet: string;
    href: string;
    label: string;
  };
};

const posts: BlogPost[] = [
  {
    title: "Novembermeeting met IBS Capital Allies",
    slug: "novembermeeting-ibs-capital-allies",
    date: "2026-11-01",
    displayDate: "November 2026",
    category: "Meeting",
    cover: "/images/meetings/ibs-capital-allies.jpg",
    excerpt:
      "In november verwelkomen we IBS Capital Allies voor een inhoudelijke avond over beleggen en vermogensbeheer.",
    body: [
      "Tijdens onze novembermeeting ontvangen we IBS Capital Allies. De onafhankelijke Nederlandse vermogensbeheerder is actief sinds 1987 en werkt voor particuliere en professionele cliënten.",
      "IBS Capital Allies neemt onze leden mee in de praktijk van beleggen en vermogensbeheer. Zo krijgen zij een beter beeld van de afwegingen, verantwoordelijkheden en langetermijnvisie die bij professioneel vermogensbeheer komen kijken.",
      "Na de presentatie gaan de fondsen verder met hun eigen portefeuillebesprekingen en investment cases.",
    ],
  },
  {
    title: "Oktobermeeting met LYNX",
    slug: "oktobermeeting-lynx",
    date: "2026-10-01",
    displayDate: "Oktober 2026",
    category: "Meeting",
    cover: "/images/meetings/lynx-office.jpg",
    excerpt:
      "In oktober komt online broker LYNX langs voor een inhoudelijke sessie over markten, handelsplatformen en actief beleggen.",
    body: [
      "Tijdens onze oktobermeeting verwelkomen we LYNX. De online broker richt zich sinds 2006 op actieve beleggers en biedt toegang tot een breed aanbod van financiële instrumenten en internationale markten.",
      "LYNX combineert brokerage met handelsplatformen, analysetools, realtime koersinformatie en educatieve content. Tijdens de meeting krijgen onze leden een inhoudelijke blik op de praktijk achter actief beleggen.",
      "Na de sessie volgen de vaste fondsbesprekingen, waarin leden hun posities en nieuwe investment cases bespreken.",
    ],
  },
  {
    title: "Mutual Fund-reis naar Milaan: beurs, wijn en positieve alpha",
    slug: "mutual-fund-reis-milaan",
    date: "2026-08-12",
    displayDate: "12 augustus 2026",
    category: "Reis",
    cover: "/images/borsa-milaan.webp",
    excerpt:
      "Van Borsa Italiana naar een wijnproeverij en het nachtleven: Milaan door de ogen van beleggers.",
    body: [
      "Voor de jaarlijkse ledenreis vertrok Mutual Fund naar Milaan. Op het programma stond een bezoek aan Borsa Italiana, waar de groep de Italiaanse beurs en de markt eromheen van dichtbij zag.",
      "Daarna verschoof de analyse van multiples naar wijn: tijdens een proeverij werd uitgebreid besproken welke fles de aantrekkelijkste risk-returnverhouding bood. De positieve alpha van de avond liet zich niet volledig in Excel vangen.",
      "Ook het Milanese nachtleven kreeg een plek in de portefeuille. EBITDA stond tijdens deze reis dan ook vooral voor Earnings Before Interest, Taxes, Depreciation and Aperitivo.",
    ],
  },
  {
    title: "Buy-pitch avond: drie nieuwe posities in de portefeuille",
    slug: "buy-pitch-avond-drie-nieuwe-posities",
    date: "2026-06-18",
    displayDate: "18 juni 2026",
    category: "Pitch",
    cover: "/images/mf-meeting-discussion.png",
    excerpt:
      "Drie teams verdedigden hun investment case. Dit is hoe analyse, discussie en stemming tot nieuwe posities leidden.",
    body: [
      "Een goede buy-pitch begint met een duidelijke vraag: waarom is de marktprijs anders dan de intrinsieke waarde? Drie teams werkten hun antwoord uit aan de hand van bedrijfsanalyse, waardering, katalysatoren en risico's.",
      "De fondsleden testten de aannames tijdens een uitgebreide vragenronde. Vooral de duurzaamheid van marges, kapitaalallocatie en scenarioanalyse kregen veel aandacht.",
      "Ook J.P. Morgan was die avond te gast. Daarmee kregen de leden naast de pitches de gelegenheid om in gesprek te gaan met professionals uit de financiële sector.",
      "Na discussie stemden de fondsen over omvang en timing. Daarmee werden drie nieuwe posities aan de gezamenlijke portefeuilles toegevoegd.",
    ],
  },
  {
    title: "Mutual Fund luidt de gong op Beursplein 5",
    slug: "mutual-fund-luidt-gong-euronext",
    date: "2026-06-16",
    displayDate: "16 juni 2026",
    category: "Event",
    cover: "/images/mf-gong-euronext.jpg",
    excerpt:
      "Ter ere van het 15-jarig bestaan opende Mutual Fund de handelsdag bij Euronext Amsterdam.",
    body: [
      "Mutual Fund vierde haar 15-jarig bestaan op een bijzondere plek: Beursplein 5. Penningmeester Tom Arends had de eer om met de gong de handelsdag bij Euronext Amsterdam officieel te openen.",
      "De ceremonie werd bijgewoond door leden van Fonds 3, het best presterende beleggingsfonds binnen de vereniging. Daarmee kwamen vijftien jaar financiële educatie, debat en beleggen met echt kapitaal samen op de Amsterdamse beursvloer.",
      "Het bezoek onderstreepte waar Mutual Fund voor staat: studenten vroeg in aanraking brengen met de werking van financiële markten en met professionals uit de sector.",
    ],
    source: {
      outlet: "De Telegraaf",
      href: "https://www.telegraaf.nl/financieel/live-adyen-en-banken-vallen-in-de-smaak-aperam-kijkt-aan-tegen-stevig-verlies/157266051.html",
      label: "Bekijk het artikel in De Telegraaf",
    },
  },
  {
    title: "Mutual Fund bij Nieuwsuur over de AEX richting 1.000 punten",
    slug: "mutual-fund-bij-nieuwsuur-aex-1000",
    date: "2026-01-13",
    displayDate: "13 januari 2026",
    category: "Pers",
    cover: "/images/press/nieuwsuur-aex.webp",
    excerpt:
      "Nieuwsuur onderzocht waarom de beurs bleef stijgen ondanks geopolitieke spanningen en sprak over de AEX die de grens van 1.000 punten naderde.",
    body: [
      "In een uitzending over de sterke beurskoersen onderzocht Nieuwsuur waarom aandelenmarkten bleven oplopen terwijl geopolitieke spanningen het nieuws domineerden.",
      "De AEX naderde op dat moment de grens van 1.000 punten. De uitzending laat zien hoe beleggers naar het verschil kijken tussen het dagelijkse nieuws, verwachtingen over bedrijfswinsten en de ontwikkeling van aandelenkoersen.",
    ],
    source: {
      outlet: "Nieuwsuur",
      href: "https://nos.nl/nieuwsuur/video/2598071-hoge-beurskoersen-terwijl-de-wereld-in-brand-staat",
      label: "Bekijk de uitzending van Nieuwsuur",
    },
  },
  {
    title: "Crisis? Voor Mutual Fund waren het juist interessante tijden",
    slug: "mutual-fund-in-het-parool-crisis",
    date: "2025-04-18",
    displayDate: "18 april 2025",
    category: "Pers",
    cover: "/images/press/parool-crisis.webp",
    excerpt:
      "Het Parool sprak met studenten van Mutual Fund over kalm blijven, analyseren en beleggen tijdens onrustige markten.",
    body: [
      "Het Parool volgde de studenten van Mutual Fund tijdens een periode waarin onzekerheid de financiële markten beheerste.",
      "Centraal stond de manier waarop leden marktnieuws vertalen naar analyse: niet impulsief reageren op iedere koersbeweging, maar de oorspronkelijke investment case blijven toetsen en besluiten gezamenlijk onderbouwen.",
    ],
    source: {
      outlet: "Het Parool",
      href: "https://www.parool.nl/amsterdam/crisis-voor-de-studenten-van-deze-beleggingsclub-zijn-het-mooie-tijden-gewoon-rustig-blijven~b885bbd7/",
      label: "Lees het artikel in Het Parool",
    },
  },
  {
    title: "Eerst beleggen en daarna door naar de kroeg",
    slug: "mutual-fund-in-het-parool-beleggingsclubjes",
    date: "2020-02-13",
    displayDate: "13 februari 2020",
    category: "Pers",
    cover: "/images/press/parool-beleggingsclub.webp",
    excerpt:
      "Het Parool bezocht Amsterdamse beleggingsclubs en beschreef hoe inhoud, echt kapitaal en het sociale verenigingsleven samenkomen.",
    body: [
      "Het Parool schreef over de combinatie die Mutual Fund al jaren kenmerkt: studenten bespreken financiële markten en portefeuilleposities serieus, maar bouwen tegelijkertijd aan een hechte vereniging.",
      "Na de analyses, pitches en stemmingen is er ruimte om informeel na te praten. Juist die combinatie maakt dat leden niet alleen kennis opbouwen, maar ook een netwerk binnen de financiële sector.",
    ],
    source: {
      outlet: "Het Parool",
      href: "https://www.parool.nl/ps/beleggingsclubjes-eerst-beleggen-en-dan-door-naar-de-kroeg~bd92a06c/",
      label: "Lees het artikel in Het Parool",
    },
  },
];

export const blogPosts = [...posts].sort((first, second) =>
  second.date.localeCompare(first.date),
);

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
