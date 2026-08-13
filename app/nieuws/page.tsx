import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nieuws & verhalen",
  description: "Blijf op de hoogte van nieuws en reizen van Mutual Fund.",
};

const newsItems = [
  {
    category: "Mijlpaal",
    title: "MF opent beurs 16 juni",
    excerpt:
      "Een historisch moment voor de vereniging: we openen de beursdag bij Euronext Amsterdam.",
    date: "16 juni 2026",
    href: "#",
  },
  {
    category: "Reis",
    title: "MF reis Milaan",
    excerpt:
      "Alles over onze aanstaande studiereis naar het financiële hart van Italië.",
    date: "Binnenkort",
    href: "#",
  },
];

export default function NewsPage() {
  return (
    <main id="main-content" className="page-shell">
      <header className="container page-header">
        <p className="eyebrow">Updates</p>
        <h1>Nieuws &amp; verhalen.</h1>
        <p>
          Een kijkje achter de schermen bij Mutual Fund, van bijzondere mijlpalen
          tot onze internationale studiereizen.
        </p>
      </header>
      <section className="container blog-list-section">
        <div className="blog-grid">
          {newsItems.map((item) => (
            <Link className="blog-card" href={item.href} key={item.title}>
              <div className="blog-card-meta">
                <span className="eyebrow accent-text">{item.category}</span>
                <time>{item.date}</time>
              </div>
              <h2>{item.title}</h2>
              <p>{item.excerpt}</p>
              <span className="text-link">Lees verder →</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
