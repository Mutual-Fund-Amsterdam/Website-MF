"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import AexBackdrop from "@/components/AexBackdrop";

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export default function HomeHero() {
  const heroRef = useRef<HTMLElement>(null);
  const bullRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const bull = bullRef.current;
    if (!hero || !bull) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pointerX = 0;
    let pointerY = 0;
    let targetPointerX = 0;
    let targetPointerY = 0;
    let animationFrame = 0;

    hero.classList.add("is-motion-ready");

    const render = () => {
      animationFrame = 0;
      const heroBounds = hero.getBoundingClientRect();
      const scrollDistance = Math.max(0, -heroBounds.top);
      const progress = clamp(scrollDistance / Math.max(hero.offsetHeight * 0.96, 1), 0, 1);

      hero.style.setProperty("--hero-scroll-progress", progress.toFixed(3));

      if (reducedMotion.matches) {
        bull.style.removeProperty("transform");
        bull.style.opacity = progress > 0.9 ? "0" : "1";
        return;
      }

      pointerX += (targetPointerX - pointerX) * 0.1;
      pointerY += (targetPointerY - pointerY) * 0.1;

      const target = document.querySelector<HTMLElement>(
        ".site-header.is-home .brand-logo",
      );
      const bullWidth = bull.offsetWidth;
      const bullHeight = bull.offsetHeight;
      const baseX = bull.offsetLeft + bullWidth / 2;
      const baseY = bull.offsetTop + bullHeight / 2;
      const travelProgress = clamp((progress - 0.08) / 0.92, 0, 1);
      const easedProgress =
        travelProgress * travelProgress * (3 - 2 * travelProgress);

      let destinationX = 0;
      let destinationY = 0;
      let destinationScale = 0.14;

      if (target) {
        const targetBounds = target.getBoundingClientRect();
        const targetX = targetBounds.left + targetBounds.width * 0.22;
        const targetY = targetBounds.top + targetBounds.height / 2;
        destinationX = targetX - baseX;
        destinationY = targetY - baseY;
        destinationScale = clamp(
          (targetBounds.width * 0.38) / Math.max(bullWidth, 1),
          0.1,
          0.18,
        );
      }

      const translateX =
        destinationX * easedProgress + pointerX * (1 - easedProgress);
      const translateY =
        destinationY * easedProgress + pointerY * (1 - easedProgress);
      const scale = 1 - (1 - destinationScale) * easedProgress;
      const rotation = pointerX * 0.022 * (1 - easedProgress);
      const fade = 1 - clamp((progress - 0.88) / 0.12, 0, 1);

      bull.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale}) rotate(${rotation}deg)`;
      bull.style.opacity = fade.toFixed(3);

      if (
        Math.abs(targetPointerX - pointerX) > 0.05 ||
        Math.abs(targetPointerY - pointerY) > 0.05
      ) {
        scheduleRender();
      }
    };

    const scheduleRender = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      const bounds = hero.getBoundingClientRect();
      targetPointerX = clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5, -0.5, 0.5) * 10;
      targetPointerY = clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1) - 0.5, -0.5, 0.5) * 6;
      scheduleRender();
    };

    const resetPointer = () => {
      targetPointerX = 0;
      targetPointerY = 0;
      scheduleRender();
    };

    render();
    window.addEventListener("scroll", scheduleRender, { passive: true });
    window.addEventListener("resize", scheduleRender);
    hero.addEventListener("pointermove", handlePointerMove, { passive: true });
    hero.addEventListener("pointerleave", resetPointer);
    reducedMotion.addEventListener("change", scheduleRender);

    return () => {
      hero.classList.remove("is-motion-ready");
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", scheduleRender);
      window.removeEventListener("resize", scheduleRender);
      hero.removeEventListener("pointermove", handlePointerMove);
      hero.removeEventListener("pointerleave", resetPointer);
      reducedMotion.removeEventListener("change", scheduleRender);
    };
  }, []);

  return (
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
        <AexBackdrop />
      </div>

      <figure ref={bullRef} className="hero-bull-motion" aria-hidden="true">
        <div className="hero-bull-shadow" />
        <img
          className="hero-bull-image"
          src="/bull.png?v=charging-bull-20260813"
          alt=""
          width="1536"
          height="1024"
          fetchPriority="high"
          decoding="sync"
        />
      </figure>
    </section>
  );
}
