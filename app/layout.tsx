import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "Mutual Fund — Beleggen met passie",
    template: "%s | Mutual Fund",
  },
  description:
    "De beleggingsvereniging voor financieel georiënteerde studenten in Amsterdam. Leer beleggen, pitch aandelen en bouw aan je netwerk.",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Mutual Fund — Beleggen met passie",
    description: "Dé beleggingsvereniging voor financieel georiënteerde studenten in Amsterdam.",
    url: "https://mutualfund.nl",
    siteName: "Mutual Fund",
    locale: "nl_NL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mutual Fund — Beleggen met passie",
  },
  other: {
    "codex-preview": "development",
  },
};

export const viewport: Viewport = {
  themeColor: "#232320",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>
        <a className="skip-link" href="#main-content">
          Naar inhoud
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
