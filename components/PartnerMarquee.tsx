/* eslint-disable @next/next/no-img-element */
import { partners } from "@/lib/content";

export default function PartnerMarquee() {
  const doubled = [...partners, ...partners];
  return (
    <div className="partner-marquee" aria-label="Partners van Mutual Fund">
      <div className="partner-track">
        {doubled.map((partner, index) => (
          <a
            className="partner-logo"
            href={partner.href}
            target="_blank"
            rel="noreferrer"
            key={`${partner.name}-${index}`}
            aria-hidden={index >= partners.length}
            tabIndex={index >= partners.length ? -1 : 0}
          >
            <span className="partner-logo-media">
              {partner.logo ? (
                <img src={partner.logo} alt={index < partners.length ? partner.name : ""} />
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
