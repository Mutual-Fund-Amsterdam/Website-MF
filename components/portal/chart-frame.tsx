"use client";
import { useRef, useState, type ReactNode } from "react";
import styles from "./chart-frame.module.css";

export default function ChartFrame({ title, children }: { title: string; children: ReactNode }) {
  const frame = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  function resize(next: boolean) {
    const dialog = frame.current;
    if (!dialog) return;
    dialog.close();
    if (next) dialog.showModal();
    else dialog.show();
    setExpanded(next);
    trigger.current?.focus({ preventScroll: true });
  }
  return <dialog open ref={frame} role={expanded ? "dialog" : "region"} aria-label={title}
    className={styles.frame} onCancel={event => { event.preventDefault(); resize(false); }}>
    <button type="button" className={styles.resize} ref={trigger} aria-label={title + (expanded ? " sluiten" : " vergroten")} onClick={() => resize(!expanded)}>
      {expanded ? "Sluiten" : "Vergroten"} <span aria-hidden="true">{expanded ? "×" : "⤢"}</span>
    </button>
    {children}
  </dialog>;
}
