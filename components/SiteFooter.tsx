import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-intro">
          <Link className="brand" href="/">
            Mutual Fund
          </Link>
          <p>
            Beleggingsvereniging voor financieel georiënteerde studenten in
            Amsterdam.
          </p>
        </div>
        <div>
          <p className="eyebrow footer-label">Vereniging</p>
          <Link href="/over-ons">Over ons</Link>
          <Link href="/events">Events</Link>
          <Link href="/bestuur">Bestuur</Link>
          <Link href="/partners">Partners</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/word-lid">Word lid</Link>
        </div>
        <div>
          <p className="eyebrow footer-label">Pers</p>
          <Link href="/pers">Publicaties</Link>
          <Link href="/pers#perscontact">Perscontact</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
        <div>
          <p className="eyebrow footer-label">Contact</p>
          <a href="mailto:secretaris@mutualfund.nl">secretaris@mutualfund.nl</a>
          <p>Roetersstraat 11</p>
          <p>1018 WB Amsterdam</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© 2026 Beleggersvereniging Mutual Fund.</p>
        <p>Amsterdam · sinds 2010</p>
      </div>
    </footer>
  );
}
