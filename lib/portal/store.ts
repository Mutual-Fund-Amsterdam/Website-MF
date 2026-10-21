import "server-only";

import { Redis } from "@upstash/redis";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { FundNumber, Member, Snapshot } from "./types";
import { codeDigest } from "./workbook";
import { createLocalStore } from "./local-store";

const PREFIX = `mf:portal:${process.env.VERCEL_ENV ?? "development"}:`;
const CURRENT_KEY = `${PREFIX}current`;
const COOKIE_NAME = "__Host-mf_session";
const SESSION_SECONDS = 12 * 60 * 60;
let redisClient: Redis | null = null;
let localClient: ReturnType<typeof createLocalStore> | null = null;

function localPreview(): boolean {
  return process.env.MF_LOCAL_PREVIEW === "1" && !process.env.VERCEL;
}

export function configured(): boolean {
  if (localPreview()) return (process.env.MF_AUTH_PEPPER?.length ?? 0) >= 32;
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    (process.env.MF_AUTH_PEPPER?.length ?? 0) >= 32,
  );
}

export function pepper(): string {
  if (!configured()) throw new Error("Ledenomgeving is nog niet ingericht.");
  return process.env.MF_AUTH_PEPPER!;
}

function redis(): Redis | ReturnType<typeof createLocalStore> {
  if (!configured()) throw new Error("Ledenomgeving is nog niet ingericht.");
  if (localPreview()) {
    if (!localClient) localClient = createLocalStore(pepper());
    return localClient;
  }
  if (!redisClient) redisClient = Redis.fromEnv();
  return redisClient;
}

export async function getSnapshot(): Promise<Snapshot | null> {
  return redis().get<Snapshot>(CURRENT_KEY);
}

export async function savePending(snapshot: Snapshot): Promise<string> {
  const id = randomBytes(24).toString("hex");
  await redis().set(`${PREFIX}pending:${id}`, snapshot, { ex: 10 * 60 });
  return id;
}

export async function publishPending(id: string): Promise<Snapshot | null> {
  if (!/^[a-f0-9]{48}$/.test(id)) return null;
  const client = redis();
  const key = `${PREFIX}pending:${id}`;
  const snapshot = await client.get<Snapshot>(key);
  if (!snapshot) return null;
  const previous = await getSnapshot();
  if (previous) {
    await client.set(`${PREFIX}archive:${previous.digest}`, previous, { ex: 30 * 24 * 60 * 60 });
  }
  await client.set(CURRENT_KEY, snapshot);
  await client.del(key);
  return snapshot;
}

type Session = { memberKey: string; snapshotDigest: string };

function tokenKey(token: string): string {
  return `${PREFIX}session:${createHash("sha256").update(token).digest("hex")}`;
}

export async function createSession(member: Member, snapshot: Snapshot): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await redis().set(tokenKey(token), { memberKey: member.key, snapshotDigest: snapshot.digest } satisfies Session, { ex: SESSION_SECONDS });
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) await redis().del(tokenKey(token));
  jar.delete(COOKIE_NAME);
}

export async function getMemberSession(): Promise<{ member: Member; snapshot: Snapshot } | null> {
  if (!configured()) return null;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || token.length > 100) return null;
  const session = await redis().get<Session>(tokenKey(token));
  if (!session) return null;
  const snapshot = await getSnapshot();
  if (!snapshot || snapshot.digest !== session.snapshotDigest) return null;
  const member = snapshot.members.find((item) => item.key === session.memberKey && item.active);
  return member ? { member, snapshot } : null;
}

export async function findMember(fund: FundNumber, code: string, snapshot: Snapshot): Promise<Member | null> {
  const digest = codeDigest(fund, code, pepper());
  return snapshot.members.find((member) => member.fund === fund && member.active && member.loginDigest === digest) ?? null;
}

export async function allowAttempt(request: Request, kind: "login" | "import"): Promise<boolean> {
  const header = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = header.split(",")[0]?.trim() || "unknown";
  const hash = createHash("sha256").update(`${pepper()}:${ip}`).digest("hex");
  const key = `${PREFIX}attempts:${kind}:${hash}`;
  const count = await redis().incr(key);
  if (count === 1) await redis().expire(key, 15 * 60);
  return count <= (kind === "login" ? 8 : 20);
}

export async function clearAttempts(request: Request, kind: "login" | "import"): Promise<void> {
  const header = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = header.split(",")[0]?.trim() || "unknown";
  const hash = createHash("sha256").update(`${pepper()}:${ip}`).digest("hex");
  await redis().del(`${PREFIX}attempts:${kind}:${hash}`);
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    if (process.env.VERCEL && parsed.protocol !== "https:") return false;
    return parsed.host === host && (parsed.protocol === "http:" || parsed.protocol === "https:");
  } catch {
    return false;
  }
}
