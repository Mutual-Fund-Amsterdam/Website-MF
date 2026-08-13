import { NextResponse } from "next/server";
import {
  getAexFallback,
  type AexSnapshot,
} from "@/lib/aexFallback";

export const revalidate = 1800;

type AexPayload = AexSnapshot;

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
};

async function fetchYahoo(period1: number, period2: number): Promise<AexPayload> {
  const endpoint = new URL(
    "https://query1.finance.yahoo.com/v8/finance/chart/%5EAEX",
  );

  endpoint.searchParams.set("period1", String(period1));
  endpoint.searchParams.set("period2", String(period2));
  endpoint.searchParams.set("interval", "1d");
  endpoint.searchParams.set("events", "history");
  endpoint.searchParams.set("includeAdjustedClose", "true");

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; MutualFundAmsterdam/1.0)",
    },
    next: { revalidate: 1800 },
  });

  if (!response.ok) throw new Error("Yahoo AEX feed unavailable");

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const points = timestamps.flatMap((timestamp, index) => {
    const close = closes[index];
    return typeof close === "number" && Number.isFinite(close)
      ? [{ timestamp, close }]
      : [];
  });

  if (points.length < 2) throw new Error("Yahoo AEX feed was incomplete");

  return {
    latest: result?.meta?.regularMarketPrice ?? points.at(-1)!.close,
    points,
  };
}

async function fetchStooq(year: number, now: Date): Promise<AexPayload> {
  const endpoint = new URL("https://stooq.com/q/d/l/");
  const endDate = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");

  endpoint.searchParams.set("s", "^aex");
  endpoint.searchParams.set("i", "d");
  endpoint.searchParams.set("d1", `${year}0101`);
  endpoint.searchParams.set("d2", endDate);

  const response = await fetch(endpoint, {
    headers: {
      Accept: "text/csv",
      "User-Agent": "Mozilla/5.0 (compatible; MutualFundAmsterdam/1.0)",
    },
    next: { revalidate: 1800 },
  });

  if (!response.ok) throw new Error("Stooq AEX feed unavailable");

  const csv = await response.text();
  const points = csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .flatMap((row) => {
      const [date, , , , closeValue] = row.split(",");
      const close = Number(closeValue);
      const timestamp = Math.floor(Date.parse(`${date}T12:00:00Z`) / 1000);

      return Number.isFinite(close) && Number.isFinite(timestamp)
        ? [{ timestamp, close }]
        : [];
    });

  if (points.length < 2) throw new Error("Stooq AEX feed was incomplete");
  return { latest: points.at(-1)!.close, points };
}

export async function GET() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const period1 = Math.floor(Date.UTC(year, 0, 1) / 1000);
  const period2 = Math.floor(Date.now() / 1000) + 86_400;
  let data: AexPayload | null = null;

  try {
    data = await fetchYahoo(period1, period2);
  } catch {
    try {
      data = await fetchStooq(year, now);
    } catch {
      data = getAexFallback(year);
    }
  }

  if (!data) {
    return NextResponse.json(
      { error: "AEX data is tijdelijk niet beschikbaar." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      symbol: "AEX",
      currency: "EUR",
      latest: data.latest,
      points: data.points,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    },
  );
}
