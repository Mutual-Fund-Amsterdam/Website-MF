import { NextResponse } from "next/server";

export const runtime = "edge";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  const data = await request.formData();
  const requiredFields = [
    "firstName",
    "lastName",
    "email",
    "study",
    "studyYear",
  ];

  for (const field of requiredFields) {
    if (!String(data.get(field) || "").trim()) {
      return NextResponse.json(
        { error: "Vul alle verplichte velden in." },
        { status: 400 },
      );
    }
  }

  const email = String(data.get("email"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Vul een geldig e-mailadres in." },
      { status: 400 },
    );
  }

  const motivationLetter = data.get("motivationLetter");
  const cv = data.get("cv");
  if (!(motivationLetter instanceof File) || !(cv instanceof File)) {
    return NextResponse.json(
      { error: "Upload zowel je motivatiebrief als je CV." },
      { status: 400 },
    );
  }

  for (const file of [motivationLetter, cv]) {
    if (file.type !== "application/pdf" || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Uploads moeten PDF-bestanden van maximaal 5 MB zijn." },
        { status: 400 },
      );
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // TODO: voeg RESEND_API_KEY en een geverifieerd RESEND_FROM-adres toe in
    // Vercel Environment Variables. Daarna verstuurt deze route de sollicitatie
    // inclusief beide PDF-bijlagen naar het secretariaat.
    return NextResponse.json(
      {
        error:
          "De online verzending wordt nog geactiveerd. Mail je documenten voorlopig naar secretaris@mutualfund.nl.",
      },
      { status: 503 },
    );
  }

  const firstName = String(data.get("firstName"));
  const lastName = String(data.get("lastName"));
  const html = `
    <h1>Nieuwe sollicitatie Mutual Fund</h1>
    <p><strong>Naam:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
    <p><strong>Telefoon:</strong> ${escapeHtml(String(data.get("phone") || "Niet opgegeven"))}</p>
    <p><strong>Universiteit & studie:</strong> ${escapeHtml(String(data.get("study")))}</p>
    <p><strong>Studiejaar:</strong> ${escapeHtml(String(data.get("studyYear")))}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Mutual Fund <sollicitaties@mutualfund.nl>",
      to: ["secretaris@mutualfund.nl"],
      reply_to: email,
      subject: `Sollicitatie ${firstName} ${lastName}`,
      html,
      attachments: [
        {
          filename: motivationLetter.name,
          content: arrayBufferToBase64(await motivationLetter.arrayBuffer()),
        },
        {
          filename: cv.name,
          content: arrayBufferToBase64(await cv.arrayBuffer()),
        },
      ],
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Versturen is niet gelukt. Probeer het later opnieuw." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
