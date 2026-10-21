import type { Metadata } from "next";
import Link from "next/link";
import { configured, getMemberSession, getSnapshot } from "@/lib/portal/store";
import ImportForm from "./import-form";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Excel importeren", robots: { index: false, follow: false } };

export default async function ImportPage() {
  const setup = configured();
  let initialized = false;
  let isAdmin = false;
  if (setup) {
    try {
      initialized = Boolean(await getSnapshot());
      isAdmin = (await getMemberSession())?.member.role.toLowerCase() === "hoofdbestuurder";
    } catch { /* Show setup state. */ }
  }
  return <main id="main-content" className={`page-shell ${styles.main}`}><div className="container"><p className="eyebrow">Bestuur / ledenomgeving</p><h1>Excel importeren.</h1><p className={styles.intro}>Kies de nieuwste versie van <strong>Website invoer - MASTER.xlsx</strong> uit je OneDrive-map. Controleer de tellingen voordat je publiceert. Het bestand en de codes komen niet in GitHub.</p>
    {!setup ? <div className={styles.notice}><h2>Technische inrichting nodig</h2><p>De beveiligde opslag en beheersleutel moeten eerst in de websiteomgeving worden ingesteld. Daarna kun je hier importeren.</p></div> : initialized && !isAdmin ? <div className={styles.notice}><h2>Alleen voor het hoofdbestuur</h2><p><Link href="/inloggen">Log in</Link> met je eigen code om een nieuwe Excelversie te plaatsen.</p></div> : <ImportForm />}
    <p className={styles.back}><Link href="/inloggen">← Terug naar inloggen</Link></p>
  </div></main>;
}
