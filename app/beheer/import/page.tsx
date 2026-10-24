import BoardNav from "../board-nav";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/portal/store";
import ImportForm from "./import-form";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Excel importeren", robots: { index: false, follow: false } };

export default async function ImportPage() {
  const session = await getMemberSession();
  if (!session) redirect("/inloggen");
  if (session.member.role.toLowerCase() !== "hoofdbestuurder") redirect("/mijn-fonds");
  return <main id="main-content" className={`page-shell ${styles.main}`}><div className="container"><p className="eyebrow">Bestuur / ledenomgeving</p><h1>Excel importeren.</h1><p className={styles.intro}>Kies de nieuwste versie van <strong>Website invoer - MASTER.xlsx</strong> uit je OneDrive-map. Controleer de tellingen voordat je publiceert. Het bestand en de codes komen niet in GitHub.</p>
    <BoardNav active="import"/><ImportForm />
    <p className={styles.back}><a href="/mijn-fonds">← Terug naar mijn fonds</a></p>
  </div></main>;
}
