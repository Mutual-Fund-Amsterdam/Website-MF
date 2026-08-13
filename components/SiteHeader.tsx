"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/over-ons", label: "Over ons" },
  { href: "/blog", label: "Blog" },
  { href: "/events", label: "Events" },
  { href: "/bestuur", label: "Bestuur" },
  { href: "/partners", label: "Partners" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const elevated = scrolled || pathname !== "/";

  return (
    <header className={`site-header${elevated ? " is-elevated" : ""}`}>
      <div className="nav-inner">
        <Link className="brand" href="/" aria-label="Mutual Fund homepage" onClick={() => setOpen(false)}>
          Mutual Fund
        </Link>
        <nav className="desktop-nav" aria-label="Hoofdnavigatie">
          {links.map((link) => (
            <Link
              key={link.href}
              className={pathname === link.href ? "is-active" : ""}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link className="button button-outline nav-apply" href="/word-lid">
          Word lid
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? "Menu sluiten" : "Menu openen"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </div>

      <div className={`mobile-menu${open ? " is-open" : ""}`} aria-hidden={!open}>
        <nav aria-label="Mobiele navigatie">
          {links.map((link, index) => (
            <Link key={link.href} href={link.href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {link.label}
            </Link>
          ))}
          <Link className="button button-primary" href="/word-lid" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
            Word lid
          </Link>
        </nav>
      </div>
    </header>
  );
}
