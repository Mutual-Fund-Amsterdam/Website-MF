/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { partners } from "@/lib/content";

export const metadata: Metadata = {
  title: "Partners",
  description: "De financiële organisaties die kennis en kansen delen met Mutual Fund.",
};

export default function PartnersPage() {
  return (
    <main id="main-content" className="page-shell">
      <header className="container page-header wide-header">
        <p className="eyebrow">Praktijk ontmoet talent</p>
        <h1>Onze partners.</h1>
        <p>
          Partners brengen expertise de meeting in en leren een selectieve groep
          ambitieuze, financieel georiënteerde studenten persoonlijk kennen.
        </p>
      </header>
      <section className="container partners-grid">
        {partners.map((partner, index) => (
          <a href={partner.href} target="_blank" rel="noreferrer" className="partner-tile" key={partner.name}>
            <span className="eyebrow">{String(index + 1).padStart(2, "0")}</span>
            <img src={partner.logo} alt={partner.name} />
            <span className="partner-name">{partner.name} ↗</span>
          </a>
        ))}
      </section>
      <section className="section page-cta">
        <div className="container page-cta-inner">
          <div>
            <p className="eyebrow">Samenwerken</p>
            <h2>Deel expertise met onze leden.</h2>
          </div>
          <Link className="button button-primary" href="/contact">Neem contact op</Link>
        </div>
      </section>
    </main>
  );
}
