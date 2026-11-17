import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { AdminError } from "./model";

export function encryptionKey(): Buffer {
  const value = process.env.MF_ADMIN_ENCRYPTION_KEY || "";
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new AdminError("De bestuursomgeving is nog niet ingericht.", 503);
  return Buffer.from(value, "hex");
}
export function seal(value: unknown, context: string): string {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(context));
  const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(b => b.toString("base64url")).join(".");
}
export function unseal<T>(value: string, context: string): T {
  const [iv, tag, body] = value.split(".").map(v => Buffer.from(v, "base64url"));
  const cipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(context)); cipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([cipher.update(body), cipher.final()]).toString());
}
export const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32(bytes: Buffer) {
  let value = 0, bits = 0, result = "";
  for (const byte of bytes) {
    value = value << 8 | byte; bits += 8;
    while (bits >= 5) { bits -= 5; result += alphabet[(value >>> bits) & 31]; }
  }
  if (bits) result += alphabet[(value << (5 - bits)) & 31];
  return result;
}
function decode32(secret: string) {
  let value = 0, bits = 0; const bytes: number[] = [];
  for (const c of secret) {
    const digit = alphabet.indexOf(c); if (digit < 0) throw new Error("Invalid base32");
    value = value << 5 | digit; bits += 5;
    if (bits >= 8) { bits -= 8; bytes.push((value >>> bits) & 255); }
  }
  return Buffer.from(bytes);
}
export function totp(secret: string, step: number, digits = 6) {
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", decode32(secret)).update(counter).digest();
  const offset = digest[19] & 15, code = (digest.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
  return String(code).padStart(digits, "0");
}
export function verifiedStep(secret: string, code: string, lastStep = -1, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return null;
  const current = Math.floor(now / 30000);
  for (const step of [current, current - 1, current + 1]) {
    if (step > lastStep && timingSafeEqual(Buffer.from(code), Buffer.from(totp(secret, step)))) return step;
  }
  return null;
}
