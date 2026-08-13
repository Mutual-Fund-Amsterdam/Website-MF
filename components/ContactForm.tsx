"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const message = String(data.get("message") || "");
    const subject = encodeURIComponent(`Websitebericht van ${name}`);
    const body = encodeURIComponent(
      `Naam: ${name}\nE-mailadres: ${email}\n\n${message}`,
    );
    setNotice("Je e-mailprogramma wordt geopend om het bericht te versturen.");
    window.location.href = `mailto:secretaris@mutualfund.nl?subject=${subject}&body=${body}`;
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="field-grid two-fields">
        <label>
          <span>Naam</span>
          <input name="name" type="text" autoComplete="name" required />
        </label>
        <label>
          <span>E-mailadres</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
      </div>
      <label>
        <span>Bericht</span>
        <textarea name="message" rows={6} required />
      </label>
      <button className="button button-primary" type="submit">
        Verstuur bericht
      </button>
      {notice && <p className="form-notice" role="status">{notice}</p>}
      <p className="form-membership-link">
        Wil je lid worden? <Link href="/word-lid">Solliciteer via de Word lid-pagina →</Link>
      </p>
    </form>
  );
}
