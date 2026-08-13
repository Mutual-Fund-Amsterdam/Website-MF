import type { Metadata } from "next";
import BoardGrid from "@/components/BoardGrid";

export const metadata: Metadata = {
  title: "Bestuur",
  description: "Maak kennis met het bestuur van Mutual Fund voor 2026–2027.",
};

export default function BoardPage() {
  return (
    <main id="main-content" className="page-shell">
      <BoardGrid />
    </main>
  );
}
