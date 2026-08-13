"use client";

import { useEffect, useMemo, useState } from "react";
import { getAexFallback, type AexSnapshot } from "@/lib/aexFallback";

type AexData = AexSnapshot;

const chartWidth = 1000;
const chartHeight = 430;
const chartPadding = 24;

export default function AexBackdrop() {
  const [data, setData] = useState<AexData | null>(() => getAexFallback());

  useEffect(() => {
    const controller = new AbortController();

    async function loadAex() {
      try {
        const response = await fetch("/api/aex", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) return;
        const nextData = (await response.json()) as AexData;
        if (nextData.points?.length > 1) setData(nextData);
      } catch {
        // The hero remains fully usable if the market feed is briefly unavailable.
      }
    }

    loadAex();
    return () => controller.abort();
  }, []);

  const chart = useMemo(() => {
    if (!data?.points?.length) return null;

    const values = data.points.map((point) => point.close);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);

    const coordinates = data.points.map((point, index) => {
      const x =
        chartPadding +
        (index / Math.max(data.points.length - 1, 1)) *
          (chartWidth - chartPadding * 2);
      const y =
        chartPadding +
        ((max - point.close) / range) * (chartHeight - chartPadding * 2);
      return { x, y };
    });

    const path = coordinates
      .map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(" ");

    return {
      path,
      last: coordinates.at(-1),
      firstDate: new Date(data.points[0].timestamp * 1000),
      lastDate: new Date(data.points.at(-1)!.timestamp * 1000),
    };
  }, [data]);

  if (!data || !chart) return null;

  const numberFormat = new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const dayFormat = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
  });
  const startLabel = `${dayFormat.format(chart.firstDate)} ${chart.firstDate.getFullYear()}`;
  const endLabel = dayFormat.format(chart.lastDate);

  return (
    <div
      className="aex-backdrop"
      role="img"
      aria-label={`AEX koersverloop van ${startLabel} tot ${endLabel}, laatste stand ${numberFormat.format(data.latest)}`}
    >
      <div className="aex-meta">
        <span>AEX · YTD</span>
        <strong>{numberFormat.format(data.latest)}</strong>
      </div>
      <svg
        className="aex-chart"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className="aex-chart-line" d={chart.path} />
        {chart.last && (
          <circle
            className="aex-chart-point"
            cx={chart.last.x}
            cy={chart.last.y}
            r="4"
          />
        )}
      </svg>
      <div className="aex-dates" aria-hidden="true">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}
