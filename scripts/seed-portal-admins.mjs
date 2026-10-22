import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { parseWorkbook } from "../lib/portal/workbook.ts";
import { createLocalStore } from "../lib/portal/local-store.ts";

const [mode, filePath] = process.argv.slice(2);
if (!(["--check", "--publish"].includes(mode) && filePath)) {
  throw new Error("Gebruik: node --experimental-strip-types scripts/seed-portal-admins.mjs --check|--publish <pad-naar-MASTER.xlsx>");
}

const target = process.env.MF_TARGET_ENV;
const local = process.env.MF_LOCAL_PREVIEW === "1" && target === "development" && !process.env.VERCEL;
if (mode === "--publish" && !local && !["preview", "production"].includes(target)) {
  throw new Error("Zet MF_TARGET_ENV op preview of production, of gebruik de lokale proefstand.");
}
const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (mode === "--publish" && !local && (!redisUrl || !redisToken)) {
  throw new Error("Upstash-omgeving ontbreekt.");
}
const pepper = process.env.MF_AUTH_PEPPER;
if (mode === "--publish" && (!pepper || pepper.length < 32)) {
  throw new Error("MF_AUTH_PEPPER ontbreekt of is te kort.");
}

const source = await parseWorkbook(readFileSync(filePath), pepper ?? "check-only-pepper-with-32-characters");
const admins = source.members.filter((member) => member.role.toLowerCase() === "hoofdbestuurder" && member.active);
if (admins.length !== 3 || admins.some((member) => member.allowedFunds.length !== 3)) {
  throw new Error("Verwacht precies drie actieve hoofdbestuurders met toegang tot alle fondsen. Controleer de Excelrollen.");
}
console.log(`Controle geslaagd: ${admins.length} hoofdbestuurders. Er worden geen overige leden of fondsstanden voorbereid.`);
if (mode === "--check") process.exit(0);

const snapshot = {
  schema: 1,
  digest: createHash("sha256").update(`admin-seed:${source.digest}`).digest("hex"),
  importedAt: new Date().toISOString(),
  requestedDate: null,
  members: admins,
  positions: [],
  cash: [],
  warnings: ["Alleen beheerders zijn voorbereid. Importeer het volledige Excelbestand na inloggen."],
};
const redis = local ? createLocalStore(pepper) : new Redis({ url: redisUrl, token: redisToken });
const key = `mf:portal:${target}:current`;
if (await redis.exists(key)) throw new Error("Er bestaat al een portalversie. De opstartstap mag niet opnieuw draaien.");
await redis.set(key, snapshot);
console.log(`Drie beheerders voorbereid in ${target}. Zij kunnen nu inloggen en het volledige Excelbestand importeren.`);
