import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Neem contact op met Mutual Fund in Amsterdam.",
};

export default function ContactPage() {
  return (
    <main id="main-content" className="page-shell">
      <header className="container page-header">
        <p className="eyebrow">We horen graag van je</p>
        <h1>Contact.</h1>
        <p>
          Voor vragen over lidmaatschap, partnerships, pers of de vereniging kun je
          rechtstreeks contact opnemen met het secretariaat.
        </p>
      </header>
      <section className="container contact-page-layout">
        <aside className="contact-details">
          <div>
            <p className="eyebrow">E-mail</p>
            <a href="mailto:secretaris@mutualfund.nl">secretaris@mutualfund.nl</a>
          </div>
          <div>
            <p className="eyebrow">Locatie</p>
            <p>Universiteit van Amsterdam<br />Roetersstraat 11<br />1018 WB Amsterdam</p>
          </div>
          <div>
            <p className="eyebrow">KvK</p>
            <p>40539233</p>
          </div>
        </aside>
        <div className="contact-card"><ContactForm /></div>
      </section>
    </main>
  );
}
