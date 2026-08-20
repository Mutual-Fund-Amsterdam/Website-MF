"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 2010, suffix: "", label: "Opgericht", duration: 1000 },
  { value: 3, suffix: "", label: "Fondsen", duration: 700 },
  { value: 380, suffix: "+", label: "Alumni", duration: 1100 },
  { value: 80, suffix: "+", label: "Actieve leden", duration: 900 },
];

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [values, setValues] = useState(stats.map(() => 0));

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setValues(stats.map((stat) => stat.value));
          } else {
            setStarted(true);
          }
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      setValues(
        stats.map((stat) =>
          Math.round(stat.value * Math.min(1, elapsed / stat.duration)),
        ),
      );
      if (elapsed < Math.max(...stats.map((stat) => stat.duration))) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started]);

  return (
    <div className="stats-row" ref={ref}>
      {stats.map((stat, index) => (
        <div className="stat" key={stat.label}>
          <p className="stat-value">
            {values[index]}
            {stat.suffix}
          </p>
          <p className="eyebrow">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
