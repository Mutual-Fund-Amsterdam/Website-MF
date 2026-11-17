import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { allowAttempt, configured, findMember, getMemberSession, integrationGet, integrationSet, integrationDelete, integrationLock, integrationUnlock, pepper, sameOrigin } from "../store";
import { AdminError } from "./model";
import { base32, encryptionKey, hash, seal, unseal, verifiedStep } from "./crypto";

type Identity = NonNullable<Awaited<ReturnType<typeof getMemberSession>>>;
type Factor = { id: string; secret: string; lastStep: number; recovery: string[] };
const cookieName = process.env.NODE_ENV === "production" ? "__Host-mf_admin" : "mf_admin";
export function administrationEnabled() { return process.env.MF_ADMIN_ENABLED === "1"; }
export async function requireIdentity(request?: Request): Promise<Identity> {
  if (!administrationEnabled() || !configured()) throw new AdminError("De bestuursomgeving is nog niet beschikbaar.", 503);
  encryptionKey();
  if (request && request.method !== "GET" && !sameOrigin(request)) throw new AdminError("Ongeldige aanvraag.", 403);
  const session = await getMemberSession();
  if (!session) throw new AdminError("Log opnieuw in.", 401);
  if (session.member.role.toLowerCase() !== "hoofdbestuurder") throw new AdminError("Alleen het hoofdbestuur heeft toegang.", 403);
  return session;
}
async function loginBinding() {
  const jar = await cookies();
  return hash(jar.get(process.env.NODE_ENV === "production" ? "__Host-mf_session" : "mf_preview_session")?.value || "");
}
export async function mfaStatus(identity: Identity) {
  const encrypted = await integrationGet<string>("admin-factor:" + identity.member.key);
  const token = (await cookies()).get(cookieName)?.value;
  const verified = token ? await integrationGet<{ key: string; digest: string; binding: string; factor: string }>("admin-session:" + hash(token)) : null;
  const factor = encrypted ? unseal<Factor>(encrypted, identity.member.key) : null;
  return { enrolled: !!factor, verified: !!(verified && factor && verified.key === identity.member.key && verified.digest === identity.member.loginDigest && verified.binding === await loginBinding() && verified.factor === factor.id) };
}
export async function requireAdmin(request?: Request) {
  const identity = await requireIdentity(request);
  if (!(await mfaStatus(identity)).verified) throw new AdminError("Bevestig eerst de tweestapsverificatie.", 428);
  return identity;
}
export async function mfaAction(request: Request, input: Record<string, string>) {
  const identity = await requireIdentity(request), key = identity.member.key;
  if (!await allowAttempt(request, "import")) throw new AdminError("Te veel pogingen. Probeer later opnieuw.", 429);
  const lease = await integrationLock("admin-factor:" + key, 30);
  if (!lease) throw new AdminError("Er wordt al een verificatie verwerkt. Probeer opnieuw.", 409);
  try {
    const stored = await integrationGet<string>("admin-factor:" + key);
    const factor = stored ? unseal<Factor>(stored, key) : null;
    const pendingKey = "admin-setup:" + await loginBinding();
    const attemptsKey = "admin-mfa-attempts:" + key;
    const attempts = await integrationGet<number>(attemptsKey) || 0;
    if (attempts >= 8) throw new AdminError("Te veel pogingen. Probeer over 15 minuten opnieuw.", 429);
    await integrationSet(attemptsKey, attempts + 1, 900);
    if (input.action === "setup") {
      if (factor) throw new AdminError("Tweestapsverificatie is al ingesteld.");
      if (!await findMember(identity.member.id, input.password || "", identity.snapshot)) throw new AdminError("De persoonlijke code klopt niet.", 401);
      const secret = base32(randomBytes(20));
      await integrationSet(pendingKey, seal({ secret, key }, pendingKey), 600);
      await integrationDelete(attemptsKey);
      return { secret, uri: "otpauth://totp/" + encodeURIComponent("Mutual Fund:" + identity.member.id) + "?secret=" + secret + "&issuer=Mutual%20Fund&digits=6&period=30" };
    }
    let current = factor, recoveryCodes: string[] | undefined;
    if (!current) {
      const pending = await integrationGet<string>(pendingKey);
      if (!pending) throw new AdminError("Begin opnieuw met instellen.", 410);
      const draft = unseal<{ secret: string; key: string }>(pending, pendingKey);
      if (draft.key !== key) throw new AdminError("Ongeldige verificatie.", 403);
      const step = verifiedStep(draft.secret, input.code);
      if (step === null) throw new AdminError("De verificatiecode klopt niet.", 401);
      recoveryCodes = Array.from({ length: 8 }, () => randomBytes(12).toString("hex"));
      current = { id: randomBytes(16).toString("hex"), secret: draft.secret, lastStep: step, recovery: recoveryCodes.map(hash) };
    } else {
      const step = verifiedStep(current.secret, input.code, current.lastStep);
      const recoveryIndex = current.recovery.indexOf(hash(input.code || ""));
      if (step === null && recoveryIndex < 0) throw new AdminError("De verificatiecode klopt niet of is al gebruikt.", 401);
      if (step !== null) current.lastStep = step;
      else current.recovery.splice(recoveryIndex, 1);
    }
    await integrationSet("admin-factor:" + key, seal(current, key));
    await integrationDelete(pendingKey); await integrationDelete(attemptsKey);
    const token = randomBytes(32).toString("base64url");
    await integrationSet("admin-session:" + hash(token), { key, digest: identity.member.loginDigest, binding: await loginBinding(), factor: current.id }, 4 * 3600);
    (await cookies()).set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 4 * 3600 });
    return { verified: true, recoveryCodes };
  } finally { await integrationUnlock("admin-factor:" + key, lease); }
}
