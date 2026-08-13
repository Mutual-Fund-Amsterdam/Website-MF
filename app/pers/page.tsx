import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pers",
  description: "Publicaties en perscontact van Mutual Fund.",
};

const publications = [
  {
    outlet: "Nieuwsuur NOS",
    subject: "Hoge beurskoersen terwijl de wereld in brand staat",
    date: "2026",
    href: "https://nos.nl/nieuwsuur/video/2598071-hoge-beurskoersen-terwijl-de-wereld-in-brand-staat",
    isVideo: true,
  },
  {
    outlet: "de Volkskrant",
    subject: "Deze jonge investeerders oefenen voor later",
    date: "2025",
    href: "https://www.volkskrant.nl/economie/deze-jonge-investeerders-oefenen-voor-later-hoe-eerder-je-begint-hoe-meer-vermogen-je-opbouwt~b0127cd9/",
  },
  {
    outlet: "Het Parool",
    subject: "Crisis? Voor de studenten van deze beleggingsclub zijn het mooie tijden: ‘Gewoon rustig blijven’",
    date: "2025",
    href: "https://www.parool.nl/amsterdam/crisis-voor-de-studenten-van-deze-beleggingsclub-zijn-het-mooie-tijden-gewoon-rustig-blijven~b885bbd7/?referrer=https%3A%2F%2Fwww.google.com%2F",
  },
  { outlet: "Beleggers Belangen", subject: "Studentenbeleggers van Mutual Fund", date: "2023", href: "#" },
  { outlet: "Het Financieele Dagblad", subject: "Amsterdamse studenten beheren eigen beleggingsfonds", date: "2022", href: "#" },
  { outlet: "Het Parool", subject: "Mutual Fund: waar studenten leren beleggen met echt geld", date: "2021", href: "#" },
  {
    outlet: "Het Parool",
    subject: "Beleggingsclubjes: eerst beleggen en dan door naar de kroeg",
    date: "2020",
    href: "https://www.parool.nl/ps/beleggingsclubjes-eerst-beleggen-en-dan-door-naar-de-kroeg~bd92a06c/",
  },
  { outlet: "De Telegraaf", subject: "Jonge beleggers zien kansen ondanks turbulente markten", date: "2020", href: "#" },
];

export default function PressPage() {
  return (
    <main id="main-content" className="page-shell">
      <header className="container page-header">
        <p className="eyebrow">In de media</p>
        <h1>Pers.</h1>
        <p>
          Mutual Fund en haar leden delen regelmatig inzichten over beleggen,
          financiële educatie en de ontwikkeling van jong talent.
        </p>
      </header>
      <section className="container press-list">
        {publications.map((item, index) => (
          <a
            href={item.href}
            target={item.href.startsWith("http") ? "_blank" : undefined}
            rel={item.href.startsWith("http") ? "noreferrer" : undefined}
            className="press-row"
            key={`${item.outlet}-${item.subject}`}
          >
            <span className="eyebrow">{String(index + 1).padStart(2, "0")}</span>
            <h2>{item.outlet}</h2>
            <p>
              {item.subject}
              {item.isVideo ? " · Video" : ""}
            </p>
            <time>{item.date}</time>
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </section>
      <section className="section section-elevated" id="perscontact">
        <div className="container press-contact">
          <p className="eyebrow">Perscontact</p>
          <h2>Een vraag of interviewverzoek?</h2>
          <p>Neem contact op met het bestuur via het secretariaat.</p>
          <a className="contact-email" href="mailto:secretaris@mutualfund.nl">secretaris@mutualfund.nl</a>
        </div>
      </section>
    </main>
  );
}
