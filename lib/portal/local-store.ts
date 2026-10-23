import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type Entry = { value: unknown; expiresAt: number | null };
const directory = resolve(process.cwd(), ".private", "portal");

export function createLocalStore(pepper: string) {
  const encryptionKey = scryptSync(pepper, "mf-local-preview-v1", 32);
  const locks = new Map<string, Promise<void>>();
  const fileFor = (key: string) => resolve(directory, `${createHash("sha256").update(key).digest("hex")}.json`);

  async function read(key: string): Promise<Entry | null> {
    try {
      const envelope = JSON.parse(await readFile(fileFor(key), "utf8")) as { iv: string; tag: string; data: string };
      const decipher = createDecipheriv("aes-256-gcm", encryptionKey, Buffer.from(envelope.iv, "base64"));
      decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
      const decoded = Buffer.concat([decipher.update(Buffer.from(envelope.data, "base64")), decipher.final()]);
      const entry = JSON.parse(decoded.toString("utf8")) as Entry;
      return entry.expiresAt !== null && entry.expiresAt <= Date.now() ? null : entry;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async function write(key: string, entry: Entry): Promise<void> {
    await mkdir(directory, { recursive: true });
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
    const data = Buffer.concat([cipher.update(JSON.stringify(entry), "utf8"), cipher.final()]);
    await writeFile(fileFor(key), JSON.stringify({ iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") }), { mode: 0o600 });
  }

  async function locked<T>(key: string, action: () => Promise<T>): Promise<T> {
    const previous = locks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((done) => { release = done; });
    const tail = previous.then(() => current);
    locks.set(key, tail);
    await previous;
    try { return await action(); }
    finally { release(); if (locks.get(key) === tail) locks.delete(key); }
  }

  return {
    async get<T>(key: string): Promise<T | null> { return (await read(key))?.value as T ?? null; },
    async set(key: string, value: unknown, options?: { ex?: number; nx?: boolean }): Promise<"OK"|null> {
      return locked(key, async()=>{
        if(options?.nx&&await read(key))return null;
        await write(key,{value,expiresAt:options?.ex?Date.now()+options.ex*1000:null});return "OK";
      });
    },
    async del(key: string): Promise<number> {
      return locked(key, async () => { try { await unlink(fileFor(key)); return 1; } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0; throw error; } });
    },
    async incr(key: string): Promise<number> {
      return locked(key, async () => { const entry = await read(key); const value = Number(entry?.value ?? 0) + 1; await write(key, { value, expiresAt: entry?.expiresAt ?? null }); return value; });
    },
    async incrby(key: string, amount: number): Promise<number> {
      return locked(key, async () => { const entry = await read(key); const value = Number(entry?.value ?? 0) + amount; await write(key, { value, expiresAt: entry?.expiresAt ?? null }); return value; });
    },
    async expire(key: string, seconds: number): Promise<number> {
      return locked(key, async () => { const entry = await read(key); if (!entry) return 0; await write(key, { value: entry.value, expiresAt: Date.now() + seconds * 1000 }); return 1; });
    },
    async exists(key: string): Promise<number> { return (await read(key)) ? 1 : 0; },
  };
}
