"use client";

import {
  DragEvent,
  FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";

type FileKind = "motivation" | "cv";
type Values = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  study: string;
  studyYear: string;
};

const initialValues: Values = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  study: "",
  studyYear: "",
};

function formatSize(size: number) {
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(size / 1024)} KB`;
}

export default function ApplicationForm() {
  const [values, setValues] = useState(initialValues);
  const [files, setFiles] = useState<Record<FileKind, File | null>>({
    motivation: null,
    cv: null,
  });
  const [fileErrors, setFileErrors] = useState<Record<FileKind, string>>({
    motivation: "",
    cv: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const [submitError, setSubmitError] = useState("");
  const motivationInput = useRef<HTMLInputElement>(null);
  const cvInput = useRef<HTMLInputElement>(null);

  const isValid = useMemo(() => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
    return Boolean(
      values.firstName.trim() &&
        values.lastName.trim() &&
        emailValid &&
        values.study.trim() &&
        values.studyYear &&
        files.motivation &&
        files.cv,
    );
  }, [values, files]);

  function validateFile(file: File, kind: FileKind) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setFileErrors((current) => ({
        ...current,
        [kind]: "Upload een PDF-bestand.",
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileErrors((current) => ({
        ...current,
        [kind]: "Dit bestand is groter dan 5 MB. Upload een kleinere versie.",
      }));
      return;
    }
    setFileErrors((current) => ({ ...current, [kind]: "" }));
    setFiles((current) => ({ ...current, [kind]: file }));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, kind: FileKind) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) validateFile(file, kind);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || !files.motivation || !files.cv) return;
    setStatus("sending");
    setSubmitError("");

    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => data.append(key, value));
    data.append("motivationLetter", files.motivation);
    data.append("cv", files.cv);

    try {
      const response = await fetch("/api/apply", { method: "POST", body: data });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Versturen is niet gelukt.");
      setStatus("success");
    } catch (error) {
      setStatus("idle");
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Versturen is niet gelukt. Probeer het later opnieuw.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="application-success" role="status">
        <span className="success-mark" aria-hidden="true">✓</span>
        <p className="eyebrow">Verzonden</p>
        <h2>Sollicitatie ontvangen.</h2>
        <p>We nemen via e-mail contact met je op.</p>
      </div>
    );
  }

  const uploadZone = (kind: FileKind, label: string) => {
    const file = files[kind];
    const inputRef = kind === "motivation" ? motivationInput : cvInput;
    return (
      <div className="upload-field">
        <span className="field-label">{label} *</span>
        <div
          className={`drop-zone${file ? " has-file" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, kind)}
          onClick={() => !file && inputRef.current?.click()}
          onKeyDown={(event) => {
            if (!file && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          role={file ? undefined : "button"}
          tabIndex={file ? -1 : 0}
          aria-label={`${label} uploaden`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) validateFile(selected, kind);
            }}
          />
          {file ? (
            <div className="file-chip">
              <span className="file-icon" aria-hidden="true">PDF</span>
              <span>
                <strong>{file.name}</strong>
                <small>{formatSize(file.size)}</small>
              </span>
              <button
                type="button"
                aria-label={`${file.name} verwijderen`}
                onClick={(event) => {
                  event.stopPropagation();
                  setFiles((current) => ({ ...current, [kind]: null }));
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <span className="upload-icon" aria-hidden="true">↑</span>
              <strong>Sleep je PDF hierheen of klik om te uploaden</strong>
              <small>Alleen PDF · max 5 MB</small>
            </>
          )}
        </div>
        {fileErrors[kind] && <p className="field-error">{fileErrors[kind]}</p>}
      </div>
    );
  };

  return (
    <form className="application-form" onSubmit={handleSubmit}>
      <div className="field-grid two-fields">
        <label>
          <span>Voornaam *</span>
          <input
            type="text"
            autoComplete="given-name"
            required
            value={values.firstName}
            onChange={(event) => setValues({ ...values, firstName: event.target.value })}
          />
        </label>
        <label>
          <span>Achternaam *</span>
          <input
            type="text"
            autoComplete="family-name"
            required
            value={values.lastName}
            onChange={(event) => setValues({ ...values, lastName: event.target.value })}
          />
        </label>
      </div>
      <div className="field-grid two-fields">
        <label>
          <span>E-mailadres *</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
          />
        </label>
        <label>
          <span>Telefoonnummer</span>
          <input
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => setValues({ ...values, phone: event.target.value })}
          />
        </label>
      </div>
      <label>
        <span>Universiteit &amp; studie *</span>
        <input
          type="text"
          required
          placeholder="bijv. UvA — Economics and Business Economics"
          value={values.study}
          onChange={(event) => setValues({ ...values, study: event.target.value })}
        />
      </label>
      <label>
        <span>Studiejaar *</span>
        <select
          required
          value={values.studyYear}
          onChange={(event) => setValues({ ...values, studyYear: event.target.value })}
        >
          <option value="" disabled>Kies je studiejaar</option>
          <option>Jaar 1</option>
          <option>Jaar 2</option>
          <option>Jaar 3</option>
          <option>Master</option>
          <option>Anders</option>
        </select>
      </label>
      <div className="upload-grid">
        {uploadZone("motivation", "Motivatiebrief")}
        {uploadZone("cv", "CV")}
      </div>
      <button
        className="button button-primary submit-application"
        type="submit"
        disabled={!isValid || status === "sending"}
      >
        {status === "sending" ? "Bezig met versturen…" : "Verstuur sollicitatie"}
      </button>
      {submitError && <p className="submit-error" role="alert">{submitError}</p>}
      <p className="privacy-note">
        Je gegevens worden uitsluitend gebruikt voor de sollicitatieprocedure.
      </p>
    </form>
  );
}
