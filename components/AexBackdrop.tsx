"use client";

import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { getAexFallback, type AexSnapshot } from "@/lib/aexFallback";

type AexData = AexSnapshot;

const chartWidth = 1000;
const chartHeight = 430;
const chartPadding = 24;

export default function AexBackdrop() {
  const [data, setData] = useState<AexData | null>(() => getAexFallback());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
    const smoothingRadius = Math.max(
      1,
      Math.min(3, Math.floor(values.length / 40)),
    );
    const displayValues = values.map((value, index) => {
      if (index === 0 || index === values.length - 1) return value;

      const start = Math.max(0, index - smoothingRadius);
      const end = Math.min(values.length, index + smoothingRadius + 1);
      const window = values.slice(start, end);
      return window.reduce((total, current) => total + current, 0) / window.length;
    });
    const min = Math.min(...displayValues);
    const max = Math.max(...displayValues);
    const range = Math.max(max - min, 1);

    const coordinates = data.points.map((point, index) => {
      const x =
        chartPadding +
        (index / Math.max(data.points.length - 1, 1)) *
          (chartWidth - chartPadding * 2);
      const y =
        chartPadding +
        ((max - displayValues[index]) / range) * (chartHeight - chartPadding * 2);
      return { x, y, point };
    });

    const path = coordinates
      .map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(" ");

    return {
      path,
      coordinates,
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
  const tooltipDateFormat = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const startLabel = `${dayFormat.format(chart.firstDate)} ${chart.firstDate.getFullYear()}`;
  const endLabel = dayFormat.format(chart.lastDate);
  const activePoint =
    activeIndex === null ? null : chart.coordinates[activeIndex] ?? null;
  const pointCount = data.points.length;

  function selectPointFromPointer(event: ReactPointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = Math.min(
      1,
      Math.max(0, (event.clientX - bounds.left) / Math.max(bounds.width, 1)),
    );
    setActiveIndex(Math.round(position * (pointCount - 1)));
  }

  function moveSelection(event: ReactKeyboardEvent<SVGSVGElement>) {
    if (event.key === "Escape") {
      setActiveIndex(null);
      event.currentTarget.blur();
      return;
    }

    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();

    if (event.key === "Home") {
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      setActiveIndex(pointCount - 1);
      return;
    }

    const direction = event.key === "ArrowLeft" ? -1 : 1;
    setActiveIndex((current) =>
      Math.min(
        pointCount - 1,
        Math.max(0, (current ?? pointCount - 1) + direction),
      ),
    );
  }

  return (
    <div className="aex-backdrop">
      <div className="aex-chart-wrap">
        <svg
          className="aex-chart"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          role="img"
          tabIndex={0}
          aria-label={
            activePoint
              ? `AEX op ${tooltipDateFormat.format(new Date(activePoint.point.timestamp * 1000))}: ${numberFormat.format(activePoint.point.close)} punten`
              : `AEX koersverloop van ${startLabel} tot ${endLabel}. Beweeg over de lijn of gebruik de pijltjestoetsen om koersen te bekijken.`
          }
          onFocus={() => setActiveIndex((current) => current ?? pointCount - 1)}
          onBlur={() => setActiveIndex(null)}
          onKeyDown={moveSelection}
          onPointerMove={selectPointFromPointer}
          onPointerDown={selectPointFromPointer}
          onPointerLeave={() => setActiveIndex(null)}
        >
          <path className="aex-chart-hit" d={chart.path} />
          <path className="aex-chart-line" d={chart.path} />
          {chart.last && (
            <circle
              className="aex-chart-point"
              cx={chart.last.x}
              cy={chart.last.y}
              r="4"
            />
          )}
          {activePoint && (
            <>
              <line
                className="aex-chart-crosshair"
                x1={activePoint.x}
                x2={activePoint.x}
                y1={chartPadding}
                y2={chartHeight - chartPadding}
              />
              <circle
                className="aex-chart-hover-point"
                cx={activePoint.x}
                cy={activePoint.y}
                r="7"
              />
            </>
          )}
        </svg>
        {activePoint && (
          <div
            className={`aex-tooltip${
              activePoint.x < 100
                ? " aex-tooltip-start"
                : activePoint.x > chartWidth - 100
                  ? " aex-tooltip-end"
                  : ""
            }`}
            style={{
              left: `${(activePoint.x / chartWidth) * 100}%`,
              top: `${(activePoint.y / chartHeight) * 100}%`,
            }}
            aria-hidden="true"
          >
            <span className="aex-tooltip-label">AEX</span>
            <time>
              {tooltipDateFormat.format(new Date(activePoint.point.timestamp * 1000))}
            </time>
            <strong>{numberFormat.format(activePoint.point.close)} punten</strong>
          </div>
        )}
      </div>
    </div>
  );
}
