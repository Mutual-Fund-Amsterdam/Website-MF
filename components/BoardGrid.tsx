import { Board } from "@/components/board";

export default function BoardGrid({ homepage = false }: { homepage?: boolean }) {
  return <Board homepage={homepage} />;
}
