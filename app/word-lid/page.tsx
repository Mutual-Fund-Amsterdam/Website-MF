import type { Metadata } from "next";
import ApplicationForm from "@/components/ApplicationForm";
import { membershipSteps } from "@/lib/content";

export const metadata: Metadata = {
  title: "Word lid",
  description: "Solliciteer voor een plek bij Mutual Fund.",
};

export default function ApplyPage() {
  return (
    <main id="main-content" className="page-shell apply-page">
      <header className="container page-header apply-header">
        <p className="eyebrow">Sollicitatie</p>
        <h1>Word lid.</h1>
        <p>
          Onze sollicitatierondes vinden tweemaal per jaar plaats, in september en
          februari. Upload je motivatiebrief en CV — het secretariaat neemt contact
          met je op.
        </p>
      </header>
      <section className="container apply-layout">
        <aside className="apply-info">
          <p className="eyebrow">Zo werkt het</p>
          <div className="apply-steps">
            {membershipSteps.map((step) => (
              <div className="apply-step" key={step.number}>
                <span className="step-number">{step.number}</span>
                <div>
                  <h2>{step.title}</h2>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="apply-question">
            Vragen? <a href="mailto:secretaris@mutualfund.nl">Mail secretaris@mutualfund.nl</a>
          </p>
        </aside>
        <div className="application-card">
          <ApplicationForm />
        </div>
      </section>
    </main>
  );
}
