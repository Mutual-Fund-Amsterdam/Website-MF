import type { Metadata } from "next";
import { configured, getSnapshot } from "@/lib/portal/store";
import LoginForm from "./login-form";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inloggen", description: "Ledenomgeving van Mutual Fund Amsterdam.", robots: { index: false, follow: false } };

export default async function LoginPage() {
  let ready = false;
  if (configured()) {
    try { ready = Boolean(await getSnapshot()); } catch { /* Show setup state. */ }
  }
  return (
    <main id="main-content" className="page-shell">
      <section className={`container ${styles.intro}`}>
        <div className={styles.loginCard}>
          <span className={styles.cardNumber}>LEDENOMGEVING</span>
          <h1>Inloggen.</h1>
          {!ready && <p className={styles.cardIntro}>De inlog wordt actief na het aansluiten van de beveiligde opslag en het voorbereiden van de drie beheerders.</p>}
          <LoginForm available={ready} />
          <p className={styles.help}>Vragen over je toegang? <a href="mailto:secretaris@mutualfund.nl">Neem contact op met het bestuur →</a></p>
        </div>
      </section>
    </main>
  );
}
