"use client";

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MemberHistoryPoint } from "@/lib/portal/member-history";
import styles from "./page.module.css";

const euro = (value: number) => `€ ${value.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;

export default function MemberChart({ points }: { points: MemberHistoryPoint[] }) {
  if (!points.length) return null;
  return <section className={styles.panel}><p className="eyebrow">Jouw deelname</p><h2>Jouw verloop.</h2><div className={styles.memberLegend}><span><i/>Waarde</span><span><i/>Netto inleg</span></div><div className={styles.memberChart}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}><CartesianGrid stroke="rgba(233,229,218,.1)" vertical={false}/><XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} stroke="#a3a096" tickLine={false} axisLine={false} minTickGap={25} fontSize={11}/><YAxis orientation="right" domain={[0, "auto"]} tickFormatter={(value: number) => euro(value)} stroke="#a3a096" tickLine={false} axisLine={false} width={78} fontSize={11}/><Tooltip contentStyle={{ background: "#232320", border: "1px solid rgba(233,229,218,.2)", color: "#e9e5da" }} formatter={(value, name) => typeof value === "number" ? [value.toLocaleString("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }), name === "value" ? "Waarde" : "Netto inleg"] : ["", ""]} labelFormatter={(label) => String(label)}/><Area type="monotone" dataKey="value" stroke="#5893b1" fill="rgba(88,147,177,.16)" strokeWidth={2} dot={false} isAnimationActive={false}/><Line type="stepAfter" dataKey="netInleg" stroke="#c6a15b" strokeWidth={2} dot={false} isAnimationActive={false}/></ComposedChart></ResponsiveContainer></div></section>;
}
