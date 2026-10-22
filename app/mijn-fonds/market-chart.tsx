"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PricePoint } from "@/lib/portal/types";
import styles from "./page.module.css";

type Series = { id: string; name: string; currency: string; points: PricePoint[] };
const windows = ["1M", "3M", "6M", "Alles"] as const;
type Window = typeof windows[number];

function windowed(points: PricePoint[], window: Window): PricePoint[] {
  if (window === "Alles") return points;
  const days = window === "1M" ? 31 : window === "3M" ? 92 : 183;
  const last = points.at(-1)?.date;
  if (!last) return points;
  const start = new Date(`${last}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days);
  return points.filter((point) => point.date >= start.toISOString().slice(0, 10));
}

function PriceChart({ series }: { series: Series }) {
  const [window, setWindow] = useState<Window>("3M");
  const points = useMemo(() => windowed(series.points, window), [series.points, window]);
  const first = points[0]?.close;
  const last = points.at(-1)?.close;
  const change = first && last ? (last / first - 1) * 100 : null;
  const money = (value: number) => `${series.currency === "EUR" ? "€" : series.currency === "USD" ? "$" : `${series.currency} `}${value.toLocaleString("nl-NL", { maximumFractionDigits: 2 })}`;
  return <div className={styles.chartShell}>
    <div className={styles.chartTop}><div><strong>{series.name}</strong><span>{last ? `${money(last)} · ${points.at(-1)?.date}` : "Nog geen historische koersdata"}</span></div>{change !== null && <b className={change >= 0 ? styles.positive : styles.negative}>{change >= 0 ? "+" : ""}{change.toLocaleString("nl-NL", { maximumFractionDigits: 2 })}%</b>}</div>
    <div className={styles.periods} aria-label="Grafiekperiode">{windows.map((item) => <button key={item} type="button" className={window === item ? styles.activePeriod : ""} onClick={() => setWindow(item)}>{item}</button>)}</div>
    {points.length >= 2 ? <div className={styles.chartArea}><ResponsiveContainer width="100%" height="100%"><AreaChart data={points} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}><defs><linearGradient id={`fill-${series.id.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5893b1" stopOpacity={0.3}/><stop offset="100%" stopColor="#5893b1" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="rgba(233,229,218,.1)" vertical={false}/><XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} stroke="#a3a096" tickLine={false} axisLine={false} minTickGap={24} fontSize={11}/><YAxis domain={["auto", "auto"]} orientation="right" tickFormatter={(value: number) => value.toLocaleString("nl-NL", { maximumFractionDigits: 0 })} stroke="#a3a096" tickLine={false} axisLine={false} width={48} fontSize={11}/><Tooltip contentStyle={{ background: "#232320", border: "1px solid rgba(233,229,218,.2)", color: "#e9e5da" }} formatter={(value) => typeof value === "number" ? money(value) : ""} labelFormatter={(label) => String(label)} /><Area type="monotone" dataKey="close" stroke="#5893b1" strokeWidth={2} fill={`url(#fill-${series.id.replace(/[^a-zA-Z0-9]/g, "")})`} dot={false} isAnimationActive={false}/></AreaChart></ResponsiveContainer></div> : <div className={styles.chartEmpty}>Koershistorie verschijnt na de eerste geslaagde dagelijkse Marketstack-verversing.</div>}
    <p className={styles.chartCaption}>Slotkoersen per handelsdag · bron: Marketstack · geen live koers</p>
  </div>;
}

export function StockCharts({ stocks, initialSelected }: { stocks: Series[]; initialSelected?: string }) {
  const [selected, setSelected] = useState(initialSelected ?? stocks[0]?.id ?? "");
  const active = stocks.find((stock) => stock.id === selected) ?? stocks[0];
  if (!active) return null;
  return <section id="koersverloop" className={styles.panel}><p className="eyebrow">Koersverloop</p><h2>Aandelen.</h2><p className={styles.muted}>Kies een aandeel om de historische slotkoersen te bekijken.</p><div className={styles.stockTabs}>{stocks.map((stock) => <button key={stock.id} type="button" aria-pressed={active.id === stock.id} onClick={() => setSelected(stock.id)}>{stock.name}</button>)}</div><PriceChart key={active.id} series={active}/></section>;
}

export function BenchmarkChart({ points }: { points: PricePoint[] }) {
  return <section className={styles.panel}><p className="eyebrow">Benchmark</p><h2>S&amp;P 500.</h2><p className={styles.muted}>Historische indexstand in USD. De grafiek is niet omgerekend naar euro of gecorrigeerd voor valuta en dividend.</p><PriceChart series={{ id: "sp500", name: "S&P 500 index", currency: "USD", points }}/></section>;
}
