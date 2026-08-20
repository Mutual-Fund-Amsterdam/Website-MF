/* eslint-disable @next/next/no-img-element */
import { partners } from "@/lib/content";

export default function PartnerMarquee({ variant = "marquee" }: { variant?: "marquee" | "grid" }) {
  const items = variant === "grid" ? partners : [...partners, ...partners];
  return (
    <div
      className={variant === "grid" ? "partner-directory" : "partner-marquee"}
      aria-label="Partners van Mutual Fund"
    >
      <div className={variant === "grid" ? "partner-directory-grid" : "partner-track"}>
        {items.map((partner, index) => (
          <a
            className={`partner-logo${variant === "grid" ? " partner-directory-card" : ""}`}
            href={partner.href}
            target="_blank"
            rel="noreferrer"
            key={`${partner.name}-${index}`}
            aria-hidden={variant === "marquee" && index >= partners.length}
            tabIndex={variant === "marquee" && index >= partners.length ? -1 : 0}
          >
            <span className="partner-logo-media">
              {partner.logo ? (
                <img
                  src={partner.logo}
                  alt={variant === "grid" || index < partners.length ? partner.name : ""}
                />
              ) : (
                <span className="partner-fallback-name" aria-hidden="true">{partner.name}</span>
              )}
            </span>
            <span className="partner-logo-name">{partner.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
