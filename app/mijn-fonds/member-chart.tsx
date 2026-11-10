"use client";

import type { MemberHistoryPoint } from "@/lib/portal/member-history";
import styles from "./page.module.css";

export default function MemberChart(_props: { points: MemberHistoryPoint[]; unavailableReason?: string }) {
  return <section className={styles.panel}>
    <p className="eyebrow">Jouw deelname</p><h2>Jouw verloop.</h2>
    <div className={styles.memberChart} aria-hidden="true" data-member-chart-blank="true" />
  </section>;
}
