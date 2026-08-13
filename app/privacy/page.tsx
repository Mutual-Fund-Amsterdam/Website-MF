import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main id="main-content" className="page-shell">
      <article className="article-container legal-page">
        <header className="article-header">
          <p className="eyebrow">Laatst bijgewerkt · 13 augustus 2026</p>
          <h1>Privacy.</h1>
          <p>Hoe Mutual Fund omgaat met informatie die je via deze website deelt.</p>
        </header>
        <div className="article-prose">
          <h2>Verantwoordelijke organisatie</h2>
          <p>Mutual Fund Amsterdam, Roetersstraat 11, 1018 WB Amsterdam, KvK 40539233. Voor privacyvragen kun je mailen naar secretaris@mutualfund.nl.</p>
          <h2>Gebruik van gegevens</h2>
          <p>Contactgegevens worden uitsluitend gebruikt om je vraag te beantwoorden. Sollicitatiegegevens en bijlagen worden uitsluitend gebruikt voor de sollicitatieprocedure en alleen gedeeld met het betrokken bestuur.</p>
          <h2>Beveiliging en bewaartermijn</h2>
          <p>We nemen passende organisatorische en technische maatregelen tegen onbevoegde toegang. Gegevens worden niet langer bewaard dan nodig voor het doel waarvoor ze zijn verstrekt.</p>
          <h2>Jouw rechten</h2>
          <p>Je kunt verzoeken om inzage, correctie of verwijdering van je gegevens. Stuur daarvoor een e-mail naar het secretariaat.</p>
        </div>
      </article>
    </main>
  );
}
