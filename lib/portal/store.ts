import "server-only";

import { Redis } from "@upstash/redis";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { DailyQuotes, FundNumber, FundValuePoint, Member, Snapshot } from "./types";
import { codeDigest, normalizeMemberId } from "./workbook";
import { portfolioView } from "./portfolio";
import { createLocalStore } from "./local-store";
import { auditLedger, reconstructDays, verifiedValues } from "./ledger";
import {fetchEurUsdHistory,fetchEstrHistory} from "./ecb";
import type { BankEvent, BrokerEvent, LedgerStorage, ReconstructionDay } from "./ledger";

const PREFIX = `mf:portal:${process.env.VERCEL_ENV ?? "development"}:`;
const CURRENT_KEY = `${PREFIX}current`;
const QUOTES_KEY = `${PREFIX}daily-quotes`;
const FUND_DAILY_KEY = `${PREFIX}fund-daily-values`;
const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-mf_session" : "mf_preview_session";
const SESSION_SECONDS = 12 * 60 * 60;
let redisClient: Redis | null = null;
let localClient: ReturnType<typeof createLocalStore> | null = null;
let hydratedCache: {digest:string;until:number;snapshot:Snapshot}|null=null;
let quoteCache:{at:string;until:number;quotes:DailyQuotes}|null=null;

function localPreview(): boolean {
  return process.env.MF_LOCAL_PREVIEW === "1" && !process.env.VERCEL;
}

export function configured(): boolean {
  if (localPreview()) return (process.env.MF_AUTH_PEPPER?.length ?? 0) >= 32;
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL) &&
    (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN) &&
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
  if (!redisClient) redisClient = new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL)!,
    token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN)!,
  });
  return redisClient;
}

export async function getSnapshot(): Promise<Snapshot | null> {
  const snapshot=await redis().get<Snapshot>(CURRENT_KEY);
  if(!snapshot)return null;
  if(hydratedCache?.digest===snapshot.digest&&hydratedCache.until>Date.now())return hydratedCache.snapshot;
  const hydrated=await hydrateLedger(snapshot);
  hydratedCache={digest:snapshot.digest,until:Date.now()+300000,snapshot:hydrated};
  return hydrated;
}

async function storeLedger(snapshot:Snapshot,id:string,ex?:number):Promise<Snapshot>{
  if(!snapshot.ledger)return snapshot;
  const descriptor:LedgerStorage={digest:id,bankChunks:Math.ceil(snapshot.ledger.bank.length/100),brokerChunks:Math.ceil(snapshot.ledger.broker.length/100),members:snapshot.ledger.members};
  const writes:Promise<unknown>[]=[];
  for(const kind of ["bank","broker"] as const){
    const rows=snapshot.ledger[kind];
    for(let i=0;i<rows.length;i+=100)writes.push(redis().set(`${PREFIX}ledger:${id}:${kind}:${i/100}`,rows.slice(i,i+100),ex?{ex}:undefined));
  }
  await Promise.all(writes);
  return {...snapshot,ledger:undefined,ledgerStorage:descriptor};
}
async function hydrateLedger(snapshot:Snapshot):Promise<Snapshot>{
  const d=snapshot.ledgerStorage;if(!d)return snapshot;
  if(!/^[a-f0-9]{48,64}$/.test(d.digest)||d.bankChunks>100||d.brokerChunks>200)throw new Error("Ongeldige bronopslag.");
  const bank=await Promise.all(Array.from({length:d.bankChunks},(_,i)=>redis().get<BankEvent[]>(`${PREFIX}ledger:${d.digest}:bank:${i}`)));
  const broker=await Promise.all(Array.from({length:d.brokerChunks},(_,i)=>redis().get<BrokerEvent[]>(`${PREFIX}ledger:${d.digest}:broker:${i}`)));
  if(bank.some(r=>!r)||broker.some(r=>!r))throw new Error("Een deel van de bronimport ontbreekt. Importeer opnieuw.");
  return {...snapshot,ledger:{bank:bank.flatMap(r=>r!),broker:broker.flatMap(r=>r!),members:d.members}};
}

export async function getDailyQuotes(): Promise<DailyQuotes | null> {
  const quotes=await redis().get<DailyQuotes>(QUOTES_KEY);if(!quotes)return null;
  if(quoteCache?.at===quotes.fetchedAt&&quoteCache.until>Date.now())return quoteCache.quotes;
  if(quotes.historyKeys){
    const pairs=await Promise.all(quotes.historyKeys.map(async key=>[key,await redis().get<NonNullable<DailyQuotes["history"]>[string]>(`${PREFIX}history:${createHash("sha256").update(key).digest("hex")}`)] as const));
    quotes.history=Object.fromEntries(pairs.map(([key,value])=>[key,value??[]]));
  }
  if(quotes.fxHistoryKeys){
    const fx=await Promise.all(quotes.fxHistoryKeys.map(async c=>[c,await redis().get<NonNullable<DailyQuotes["fxHistory"]>[string]>(`${PREFIX}fx-history:${c}`)] as const));
    quotes.fxHistory=Object.fromEntries(fx.map(([c,p])=>[c,p??[]]));
  }
  quoteCache={at:quotes.fetchedAt,until:Date.now()+300000,quotes};return quotes;
}

export async function saveDailyQuotes(quotes: DailyQuotes): Promise<void> {
  const keys=Object.keys(quotes.history??{});
  await Promise.all(keys.map(key=>redis().set(`${PREFIX}history:${createHash("sha256").update(key).digest("hex")}`,quotes.history![key])));
  const currencies=Object.keys(quotes.fxHistory??{});
  await Promise.all(currencies.map(c=>redis().set(`${PREFIX}fx-history:${c}`,quotes.fxHistory![c])));
  await redis().set(QUOTES_KEY, {...quotes,history:undefined,historyKeys:keys,fxHistory:undefined,fxHistoryKeys:currencies});quoteCache=null;
}

export async function reserveMarketstackCalls(cost:number,historical=false):Promise<number>{
  if(!Number.isSafeInteger(cost)||cost<1||cost>100)throw new Error("Ongeldige koersaanvraag.");
  const month=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Amsterdam",year:"numeric",month:"2-digit"}).format(new Date());
  const opening=/^(\d{4}-\d{2}):(\d+)$/.exec(process.env.MARKETSTACK_USAGE_BASELINE??"");
  if(historical&&(!opening||opening[1]>month))throw new Error("Leg eerst de beginstand van het maandverbruik vast voordat de historische uitbreiding start.");
  const baseline=opening?.[1]===month?Number(opening[2]):0;
  const key=`${PREFIX}marketstack-usage:${month}`;const used=baseline+await redis().incrby(key,cost);
  const limit=historical?8000:10000;
  if(used>limit){await redis().incrby(key,-cost);throw new Error("Marketstack-maandbudget bereikt; geen aanvraag verstuurd.");}
  return used;
}

export async function getFundDailyValues(): Promise<FundValuePoint[]> {
  const legacy=await redis().get<FundValuePoint[]>(FUND_DAILY_KEY)??[];
  const snapshot=await redis().get<Snapshot>(CURRENT_KEY);
  if(!snapshot?.ledgerStorage&&!snapshot?.ledger)return legacy;
  const reconstructed=await redis().get<FundValuePoint[]>(`${PREFIX}reconstruction:${snapshot.digest}:verified`)??[];
  return [...legacy.filter(p=>p.coverage==="verified"),...reconstructed];
}

export async function getReconstructionDays(snapshot:Snapshot,fund:FundNumber):Promise<ReconstructionDay[]>{
  const years=await redis().get<string[]>(`${PREFIX}reconstruction:${snapshot.digest}:${fund}:years`)??[];
  const pages=await Promise.all(years.map(y=>redis().get<ReconstructionDay[]>(`${PREFIX}reconstruction:${snapshot.digest}:${fund}:${y}`)));
  return pages.flatMap(p=>p??[]).sort((a,b)=>a.date.localeCompare(b.date));
}
export async function recordReconstruction(snapshot:Snapshot,quotes:DailyQuotes|null):Promise<void>{
  if(!snapshot.ledger)return;
  const days=reconstructDays(snapshot,quotes);
  for(const fund of [1,2,3] as const){
    const rows=days.filter(p=>p.fund===fund);const years=[...new Set(rows.map(p=>p.date.slice(0,4)))];
    await Promise.all(years.map(y=>redis().set(`${PREFIX}reconstruction:${snapshot.digest}:${fund}:${y}`,rows.filter(p=>p.date.startsWith(y)))));
    await redis().set(`${PREFIX}reconstruction:${snapshot.digest}:${fund}:years`,years);
  }
  await redis().set(`${PREFIX}reconstruction:${snapshot.digest}:verified`,verifiedValues(days));
  await redis().set(`${PREFIX}reconstruction:${snapshot.digest}:audit`,auditLedger(snapshot));
}

export async function recordFundDailyValues(snapshot: Snapshot, quotes: DailyQuotes): Promise<void> {
  if(snapshot.ledger){await recordReconstruction(snapshot,quotes);return;}
  const dates=snapshot.positions.map(p=>quotes.prices[`${p.exchange}:${p.ticker.toUpperCase()}`]?.date).filter((d):d is string=>Boolean(d));
  if(dates.length!==snapshot.positions.length||!dates.length)return;
  const date=[...dates].sort()[0];
  const aligned:DailyQuotes={...quotes,prices:{...quotes.prices}};
  for(const p of snapshot.positions){const key=`${p.exchange}:${p.ticker.toUpperCase()}`;const point=quotes.history?.[key]?.find(r=>r.date===date);if(!point)return;aligned.prices[key]={...quotes.prices[key],...point};}
  const old = await getFundDailyValues();
  const values = old.filter((point) => point.date !== date);
  for (const fund of [1, 2, 3] as const) {
    const totalUnits = snapshot.totalUnitsByFund?.[fund];
    if (!totalUnits || totalUnits <= 0) continue;
    const positions = snapshot.positions.filter((item) => item.fund === fund);
    const cash = snapshot.cash.find((item) => item.fund === fund);
    const fundValue = portfolioView(positions, cash, aligned).fundValue;
    if (fundValue !== null) values.push({ fund, date, nav: fundValue / totalUnits, fundValue,coverage:"indicative" });
  }
  await redis().set(FUND_DAILY_KEY, values.sort((a, b) => a.date.localeCompare(b.date)).slice(-3 * 3653));
}

export async function claimDailyRefresh(date: string): Promise<boolean> {
  const key = `${PREFIX}quotes-refresh:${date}`;
  return (await redis().set(key, "running", { nx: true, ex: 36 * 60 * 60 })) === "OK";
}

export async function savePending(snapshot: Snapshot): Promise<string> {
  const id = randomBytes(24).toString("hex");
  const header=await storeLedger(snapshot,id,10*60);
  await redis().set(`${PREFIX}pending:${id}`, header, { ex: 10 * 60 });
  return id;
}

export async function publishPending(id: string): Promise<Snapshot | null> {
  if (!/^[a-f0-9]{48}$/.test(id)) return null;
  const client = redis();
  const key = `${PREFIX}pending:${id}`;
  const stored = await client.get<Snapshot>(key);
  if (!stored) return null;
  const snapshot=await hydrateLedger(stored);
  const previous = await getSnapshot();
  if (previous) {
    const previousHeader=await storeLedger(previous,previous.digest);
    await client.set(`${PREFIX}archive:${previous.digest}`, previousHeader, { ex: 30 * 24 * 60 * 60 });
  }
  const header=await storeLedger(snapshot,snapshot.digest);
  const quotes = await getDailyQuotes();
  // Initialise missing free reference series on administrator import, never on a member visit.
  // This does not request stock/index data or spend Marketstack credits.
  if(quotes&&(!quotes.eurUsdHistory?.length||!quotes.estrHistory?.length)){
    const [usd,estr]=await Promise.all([
      quotes.eurUsdHistory?.length?Promise.resolve(quotes.eurUsdHistory):fetchEurUsdHistory().catch(()=>quotes.eurUsdHistory),
      quotes.estrHistory?.length?Promise.resolve(quotes.estrHistory):fetchEstrHistory().catch(()=>quotes.estrHistory),
    ]);
    quotes.eurUsdHistory=usd;quotes.estrHistory=estr;
    if(usd?.length||estr?.length)await saveDailyQuotes(quotes);
  }
  if (quotes) await recordFundDailyValues(snapshot, quotes);
  else if(snapshot.ledger)await recordReconstruction(snapshot,null);
  await client.set(CURRENT_KEY, header);
  hydratedCache=null;
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

export async function findMember(id: string, code: string, snapshot: Snapshot): Promise<Member | null> {
  const normalizedId = normalizeMemberId(id);
  const digest = codeDigest(id, code, pepper());
  return snapshot.members.find((member) => normalizeMemberId(member.id) === normalizedId && member.active && member.loginDigest === digest) ?? null;
}

export async function allowAttempt(request: Request, kind: "login" | "import" | "feedback"): Promise<boolean> {
  const header = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = header.split(",")[0]?.trim() || "unknown";
  const hash = createHash("sha256").update(`${pepper()}:${ip}`).digest("hex");
  const key = `${PREFIX}attempts:${kind}:${hash}`;
  const count = await redis().incr(key);
  if (count === 1) await redis().expire(key, 15 * 60);
  return count <= (kind === "login" ? 8 : 20);
}

export type FundFeedback = { id: number; fund: FundNumber; memberId: string; name: string; text: string; createdAt: string };
export async function saveFeedback(member: Member, fund: FundNumber, text: string): Promise<void> {
  if (!member.allowedFunds.includes(fund) || !text.trim() || text.length > 3000) throw new Error("Ongeldige feedback.");
  const id = await redis().incr(`${PREFIX}feedback-count`);
  await redis().set(`${PREFIX}feedback:${id}`, {id, fund, memberId: member.id, name: member.name, text: text.trim(), createdAt: new Date().toISOString()} satisfies FundFeedback);
}
export async function getFeedback(member: Member): Promise<FundFeedback[]> {
  if (member.role.toLowerCase() !== "hoofdbestuurder") throw new Error("Geen toegang.");
  const count = await redis().get<number>(`${PREFIX}feedback-count`) ?? 0;
  const rows: FundFeedback[] = [];
  for (let end=count; end>0; end-=50) {
    const batch=await Promise.all(Array.from({length:Math.min(50,end)},(_,i)=>redis().get<FundFeedback>(`${PREFIX}feedback:${end-i}`)));
    rows.push(...batch.filter((p):p is FundFeedback=>p!==null));
  }
  return rows;
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
