import "server-only";
import { integrationGet, integrationSet } from "../store";
import { seal, unseal } from "./crypto";
import { AdminError } from "./model";
export async function saveTemporary<T>(id: string, value: T) {
  const encrypted = seal(value, "import:" + id), chunks = encrypted.match(/.{1,48000}/g)!;
  if (chunks.length > 300) throw new AdminError("Deze import is te groot.", 413);
  await Promise.all(chunks.map((chunk, i) => integrationSet(`admin-import:${id}:${i}`, chunk, 600)));
  await integrationSet("admin-import:" + id, chunks.length, 600);
}
export async function readTemporary<T>(id: string): Promise<T> {
  const count = await integrationGet<number>("admin-import:" + id);
  if (!count || !Number.isInteger(count) || count < 1 || count > 300) throw new AdminError("De importcontrole is verlopen.", 410);
  const chunks = await Promise.all(Array.from({ length: count }, (_, i) => integrationGet<string>(`admin-import:${id}:${i}`)));
  if (chunks.some(c => !c)) throw new AdminError("De importcontrole is verlopen.", 410);
  return unseal<T>(chunks.join(""), "import:" + id);
}
