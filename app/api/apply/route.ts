import { NextResponse } from "next/server";

export const runtime = "edge";

const MAX_TOTAL_FILE_SIZE = 3.5 * 1024 * 1024;

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

  if (motivationLetter.size + cv.size > MAX_TOTAL_FILE_SIZE) {
    return NextResponse.json(
      { error: "Je PDF-bestanden mogen samen maximaal 3,5 MB zijn." },
      { status: 413 },
    );
  }

  for (const file of [motivationLetter, cv]) {
    if (
      file.size === 0 ||
      !file.name.toLowerCase().endsWith(".pdf") ||
      (await file.slice(0, 5).text()) !== "%PDF-"
    ) {
      return NextResponse.json(
        { error: "Upload geldige PDF-bestanden voor je motivatiebrief en CV." },
        { status: 400 },
      );
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
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

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
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
  } catch {
    return NextResponse.json(
      { error: "De e-maildienst is tijdelijk niet bereikbaar. Probeer het later opnieuw." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    console.error("Resend rejected an application email", response.status);
    return NextResponse.json(
      { error: "Versturen is niet gelukt. Mail je documenten rechtstreeks naar secretaris@mutualfund.nl." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
