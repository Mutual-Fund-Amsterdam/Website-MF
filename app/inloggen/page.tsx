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
          <LoginForm available={ready} />
        </div>
      </section>
    </main>
  );
}
