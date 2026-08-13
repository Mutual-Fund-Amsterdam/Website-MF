export type BlogCategory = "Meeting" | "Reis" | "Event" | "Pitch";

export type BlogPost = {
  title: string;
  slug: string;
  date: string;
  displayDate: string;
  category: BlogCategory;
  cover: string;
  excerpt: string;
  body: string[];
};

// Voeg een nieuw object aan deze array toe om een blogpost te publiceren.
export const blogPosts: BlogPost[] = [
  {
    title: "Recap: maandelijkse meeting oktober",
    slug: "recap-maandelijkse-meeting-oktober",
    date: "2026-10-15",
    displayDate: "15 oktober 2026",
    category: "Meeting",
    cover:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85",
    excerpt:
      "Van macro-update tot fondsbespreking: dit waren de ideeën en inzichten die onze oktobermeeting bepaalden.",
    body: [
      "Tijdens onze maandelijkse meeting in oktober kwamen de drie fondsen opnieuw samen om de portefeuilles kritisch tegen het licht te houden. De macrocommissie opende de avond met een analyse van renteverwachtingen, inflatie en de gevolgen voor Europese aandelen.",
      "Na de partnerpresentatie gingen de fondsen uiteen. Leden bespraken de resultaten van bestaande posities, toetsten hun oorspronkelijke investment cases en stemden over voorgestelde wijzigingen. De avond eindigde zoals altijd met een informele borrel.",
      "De volgende meeting vindt plaats op de tweede woensdag van november. Leden ontvangen het programma en de voorbereidende stukken via de gebruikelijke kanalen.",
    ],
  },
  {
    title: "Mutual Fund reis naar Londen: op bezoek bij J.P. Morgan",
    slug: "mutual-fund-reis-londen-jpmorgan",
    date: "2026-08-12",
    displayDate: "12 augustus 2026",
    category: "Reis",
    cover:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=85",
    excerpt:
      "Een inhoudelijke reis langs de City, met gesprekken over markten, private banking en carrières in finance.",
    body: [
      "Londen blijft een van de belangrijkste financiële centra ter wereld. Tijdens onze jaarlijkse reis bezochten leden verschillende partijen in de City en maakten zij kennis met de mensen achter internationale kapitaalmarkten.",
      "Bij J.P. Morgan stond de ontwikkeling van private banking in Nederland centraal. De sessie bood een zeldzame combinatie van marktinhoud, persoonlijke loopbaaninzichten en een open gesprek over de vaardigheden die jonge professionals nodig hebben.",
      "Naast het inhoudelijke programma was er vanzelfsprekend ruimte om Londen te ontdekken en elkaar buiten de maandelijkse meetings beter te leren kennen.",
    ],
  },
  {
    title: "Buy-pitch avond: drie nieuwe posities in de portefeuille",
    slug: "buy-pitch-avond-drie-nieuwe-posities",
    date: "2026-06-18",
    displayDate: "18 juni 2026",
    category: "Pitch",
    cover:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=85",
    excerpt:
      "Drie teams verdedigden hun investment case. Dit is hoe analyse, discussie en stemming tot nieuwe posities leidden.",
    body: [
      "Een goede buy-pitch begint met een duidelijke vraag: waarom is de marktprijs anders dan de intrinsieke waarde? Drie teams werkten hun antwoord uit aan de hand van bedrijfsanalyse, waardering, katalysatoren en risico's.",
      "De fondsleden testten de aannames tijdens een uitgebreide vragenronde. Vooral de duurzaamheid van marges, kapitaalallocatie en scenarioanalyse kregen veel aandacht.",
      "Na discussie stemden de fondsen over omvang en timing. Daarmee werden drie nieuwe posities aan de gezamenlijke portefeuilles toegevoegd.",
    ],
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
