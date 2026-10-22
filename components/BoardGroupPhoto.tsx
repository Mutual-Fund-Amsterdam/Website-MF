"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties, type MouseEvent } from "react";
import { boardMembers } from "@/lib/board-members";
import styles from "./BoardGroupPhoto.module.css";

// Coordinates follow the people in the original 6000 × 4000 photograph.
// Keeping the image's 3:2 ratio makes these regions scale with it.
const regions = [
  { slug: "lucas-ham", shape: "polygon(12% 28%, 27% 25%, 30% 49%, 31% 100%, 11% 100%, 12% 51%)", labelX: "20%" },
  { slug: "annemijn-hekelaar-gombert", shape: "polygon(36% 40%, 46% 39%, 49% 60%, 49% 100%, 32% 100%, 33% 60%)", labelX: "40%" },
  { slug: "bryan-berlijn", shape: "polygon(50% 29%, 59% 29%, 63% 52%, 64% 100%, 47% 100%, 47% 54%)", labelX: "55%" },
  { slug: "florian-van-heest", shape: "polygon(69% 24%, 79% 24%, 83% 50%, 84% 100%, 64% 100%, 66% 49%)", labelX: "74%" },
] as const;

export default function BoardGroupPhoto() {
  const [hoverSlug, setHoverSlug] = useState<string | null>(null);
  const [tapSlug, setTapSlug] = useState<string | null>(null);
  const activeSlug = tapSlug ?? hoverSlug;
  const activeRegion = regions.find((region) => region.slug === activeSlug);
  const activeMember = boardMembers.find((member) => member.slug === activeSlug);

  function onPersonClick(event: MouseEvent<HTMLAnchorElement>, slug: string) {
    if (window.matchMedia("(hover: none)").matches && tapSlug !== slug) {
      event.preventDefault();
      setTapSlug(slug);
    }
  }

  return (
    <figure
      className={styles.figure}
      onMouseLeave={() => setHoverSlug(null)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHoverSlug(null); }}
    >
      <Image
        src="/board/bestuur-2026.webp"
        alt="Het 16e bestuur, van links naar rechts: Lucas Ham, Annemijn Hekelaar Gombert, Bryan Berlijn en Florian van Heest"
        width={3000}
        height={2000}
        sizes="(min-width: 1168px) 1120px, calc(100vw - 48px)"
        className={styles.photo}
      />
      {regions.map((region) => {
        const member = boardMembers.find((item) => item.slug === region.slug)!;
        return (
          <Link
            key={region.slug}
            href={`/bestuur#${member.slug}`}
            className={styles.hotspot}
            style={{ clipPath: region.shape }}
            aria-label={`${member.name}, ${member.role}. Bekijk profiel.`}
            onMouseEnter={() => {
              if (window.matchMedia("(hover: hover)").matches) {
                setHoverSlug(member.slug);
              }
            }}
            onFocus={() => setHoverSlug(member.slug)}
            onClick={(event) => onPersonClick(event, member.slug)}
          />
        );
      })}
      {activeMember && activeRegion && (
        <div className={styles.card} style={{ "--label-x": activeRegion.labelX } as CSSProperties}>
          <span className={styles.name}>{activeMember.name}</span>
          <span className={styles.role}>{activeMember.role}</span>
          <div className={styles.contact}>
            <a href={`mailto:${activeMember.email}`}>E-mail</a>
            <a href={activeMember.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>
      )}
    </figure>
  );
}
