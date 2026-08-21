"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import AexBackdrop from "@/components/AexBackdrop";
import PartnerMarquee from "@/components/PartnerMarquee";
import styles from "./HomeHero.module.css";

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const smoothstep = (value: number) => value * value * (3 - 2 * value);

type MotionState = {
  pointerX: number;
  pointerY: number;
  bullProgress: number;
  marketProgress: number;
};

const bullSource = "/hero-bull-front-20260815.webp";

export default function HomeHero() {
  const heroRef = useRef<HTMLElement>(null);
  const bullRef = useRef<HTMLElement>(null);
  const marketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const bull = bullRef.current;
    const market = marketRef.current;
    if (!hero || !bull || !market) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const target: MotionState = {
      pointerX: 0,
      pointerY: 0,
      bullProgress: 0,
      marketProgress: 0,
    };
    const current: MotionState = { ...target };
    let animationFrame = 0;

    const render = () => {
      animationFrame = 0;
      const ease = 0.075;

      current.pointerX += (target.pointerX - current.pointerX) * ease;
      current.pointerY += (target.pointerY - current.pointerY) * ease;
      current.bullProgress += (target.bullProgress - current.bullProgress) * ease;
      current.marketProgress += (target.marketProgress - current.marketProgress) * ease;

      if (reducedMotion.matches) {
        bull.style.removeProperty("transform");
        bull.style.removeProperty("opacity");
        market.style.removeProperty("transform");
        market.style.removeProperty("opacity");
      } else {
        const bullFade = 1 - smoothstep(current.bullProgress);
        const marketFade = 1 - smoothstep(current.marketProgress);
        const translateX = current.pointerX + current.bullProgress * 34;
        const translateY = current.pointerY + current.bullProgress * 30;
        const scale = 1 + current.bullProgress * 0.05;

        bull.style.transform = `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        bull.style.opacity = bullFade.toFixed(4);
        market.style.transform = `translate3d(0, ${(current.marketProgress * 18).toFixed(2)}px, 0)`;
        market.style.opacity = marketFade.toFixed(4);

        hero.style.setProperty(
          "--bull-blur",
          `${(1.45 + current.bullProgress * 3.8).toFixed(2)}px`,
        );
        hero.style.setProperty(
          "--bull-focus-blur",
          `${(0.35 + current.bullProgress * 2.6).toFixed(2)}px`,
        );
        hero.style.setProperty(
          "--bull-brightness",
          (0.6 - current.bullProgress * 0.18).toFixed(3),
        );
      }

      const moving = (Object.keys(current) as Array<keyof MotionState>).some(
        (key) => Math.abs(target[key] - current[key]) > 0.001,
      );
      if (moving) animationFrame = window.requestAnimationFrame(render);
    };

    const scheduleRender = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(render);
    };

    const updateScroll = () => {
      const heroBounds = hero.getBoundingClientRect();
      const scrollDistance = Math.max(0, -heroBounds.top);

      target.bullProgress = clamp(
        scrollDistance / Math.max(hero.offsetHeight * 0.28, 1),
        0,
        1,
      );
      target.marketProgress = clamp(
        scrollDistance / Math.max(hero.offsetHeight * 0.43, 1),
        0,
        1,
      );
      scheduleRender();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      const bounds = hero.getBoundingClientRect();
      const normalizedX = clamp(
        (event.clientX - bounds.left) / Math.max(bounds.width, 1),
        0,
        1,
      );
      const normalizedY = clamp(
        (event.clientY - bounds.top) / Math.max(bounds.height, 1),
        0,
        1,
      );
      target.pointerX = normalizedX * 24 - 12;
      target.pointerY = normalizedY * 20 - 10;
      scheduleRender();
    };

    const resetPointer = () => {
      target.pointerX = 0;
      target.pointerY = 0;
      scheduleRender();
    };

    updateScroll();
    hero.addEventListener("pointermove", handlePointerMove, { passive: true });
    hero.addEventListener("pointerleave", resetPointer);
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });
    reducedMotion.addEventListener("change", scheduleRender);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      hero.removeEventListener("pointermove", handlePointerMove);
      hero.removeEventListener("pointerleave", resetPointer);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      reducedMotion.removeEventListener("change", scheduleRender);
    };
  }, []);

  return (
    <>
      <section ref={heroRef} className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title" className="hero-title">
            <span>De beleggings-</span>
            <span>vereniging voor de</span>
            <span>financiële leiders</span>
            <span>
              van <em>morgen.</em>
            </span>
          </h1>
          <div className="hero-actions">
            <Link className="button button-primary" href="/word-lid">
              Word lid
            </Link>
            <Link className="hero-about-link" href="/over-ons">
              Over ons <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="hero-market">
          <div ref={marketRef} className={styles.marketMotion}>
            <AexBackdrop />
          </div>
        </div>

        <figure
          ref={bullRef}
          className={`hero-bull-motion ${styles.bullMotion}`}
          aria-hidden="true"
        >
          <div className="hero-bull-shadow" />
          <img
            className={`hero-bull-image ${styles.bullImage} ${styles.bullBase}`}
            src={bullSource}
            alt=""
            width="1536"
            height="1180"
            fetchPriority="high"
            decoding="sync"
          />
          <img
            className={`hero-bull-image ${styles.bullImage} ${styles.bullFocus}`}
            src={bullSource}
            alt=""
            width="1536"
            height="1180"
            decoding="sync"
          />
        </figure>
      </section>

      <div className="hero-partner-strip" id="partners">
        <PartnerMarquee />
      </div>
    </>
  );
}
