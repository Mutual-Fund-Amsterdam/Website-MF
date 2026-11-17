import "server-only";
import { randomBytes } from "node:crypto";
import { compareAdminRevision, getSnapshot, integrationGet, integrationSet, integrationLock, integrationUnlock, pepper, publishAdministration } from "../store";
import { AdminError, type Administration, type AdminView, type BookingInput } from "./model";
import { book, catalogFor, newAdministration, projectAdministration } from "./engine";
import { hash, seal, unseal } from "./crypto";

type Header = { revision: string; chunks: number };
async function readVersion(header: Header): Promise<Administration> {
  if (header.chunks < 1 || header.chunks > 300 || !/^[a-f0-9]{64}$/.test(header.revision)) throw new AdminError("Ongeldige bestuursopslag.", 503);
  const chunks = await Promise.all(Array.from({ length: header.chunks }, (_, i) => integrationGet<string>(`admin-version:${header.revision}:${i}`)));
  if (chunks.some(c => !c)) throw new AdminError("Een deel van de werkstand ontbreekt.", 503);
  return unseal<Administration>(chunks.join(""), "admin:" + header.revision);
}
export async function working() {
  const live = await getSnapshot();
  if (!live) throw new AdminError("Importeer eerst de gecontroleerde beginstand.", 409);
  const header = await integrationGet<Header>("admin-working");
  if (!header) return { state: newAdministration(live), header: null, live };
  const state = await readVersion(header);
  if (live.administration?.revision === state.revision) {
    const next = newAdministration(live);
    return { state: { ...next, revision: state.revision, catalog: catalogFor(state), archive: state.archive, audit: [...state.audit, ...state.bookings.map(({ id, actor, at, label }) => ({ id, actor, at, label }))], updatedAt: state.updatedAt }, header, live };
  }
  return { state, header, live };
}
export function view(state: Administration, liveDigest: string): AdminView {
  const snapshot = projectAdministration(state);
  return {
    revision: state.revision, baseDigest: state.baseDigest, publishedDigest: liveDigest, updatedAt: state.updatedAt,
    members: snapshot.members.map(({ loginDigest, ...member }) => member),
    positions: snapshot.positions, cash: snapshot.cash, transactions: snapshot.transactions ?? [],
    trades: (snapshot.ledger?.broker ?? []).filter(e => ["Buy", "Sell"].includes(e.kind)).map(({ date, fund, symbol, kind, quantity }) => ({ date, fund, symbol, kind, quantity })),
    units: snapshot.totalUnitsByFund, catalog: catalogFor(state), archive: state.archive,
    audit: state.audit,
    bookings: state.bookings.map(({ id, actor, at, label }) => ({ id, actor, at, label })),
  };
}
export async function saveWorking(state: Administration, expected: Header | null) {
  const body = seal(state, "admin:" + state.revision), chunks = body.match(/.{1,48000}/g)!;
  if (chunks.length > 300) throw new AdminError("De administratie is te groot. Publiceer de gecontroleerde werkstand voordat je verder boekt.");
  await Promise.all(chunks.map((chunk, i) => integrationSet(`admin-version:${state.revision}:${i}`, chunk)));
  if (!await compareAdminRevision(expected?.revision ?? null, { revision: state.revision, chunks: chunks.length })) {
    throw new AdminError("Een andere bestuurder heeft opgeslagen. Je invoer staat nog klaar. Controleer de nieuwste stand.", 409);
  }
}
export async function withWriter<T>(action: () => Promise<T>) {
  const lease = await integrationLock("admin-writer", 300);
  if (!lease) throw new AdminError("Een andere bestuurder slaat op. Probeer opnieuw.", 409);
  try { return await action(); } finally { await integrationUnlock("admin-writer", lease); }
}
export async function saveBooking(input: BookingInput, id: string, expected: string, actor: string) {
  return withWriter(async () => {
    const { state, header, live } = await working();
    const duplicate = state.bookings.find(b => b.id === id);
    const receipt = await integrationGet<{ actor: string; fingerprint: string }>("admin-receipt:" + id);
    const fingerprint = hash(JSON.stringify(Object.entries(input).sort(([a], [b]) => a.localeCompare(b))));
    if (receipt || duplicate) {
      if (duplicate && (duplicate.actor !== actor || duplicate.requestHash !== fingerprint) && !receipt) throw new AdminError("Deze aanvraagcode is al voor een andere boeking gebruikt.", 409);
      if (receipt && (receipt.actor !== actor || receipt.fingerprint !== fingerprint)) throw new AdminError("Deze aanvraagcode is al voor een andere boeking gebruikt.", 409);
      return { view: view(state, live.digest), duplicate: true };
    }
    if (state.revision !== expected || state.baseDigest !== live.digest) throw new AdminError("De stand is gewijzigd. Vernieuw en controleer je invoer.", 409);
    const result = book(state, input, id, actor, pepper());
    result.state.bookings.at(-1)!.requestHash = fingerprint;
    await saveWorking(result.state, header);
    // Journal entry in the committed state is the durable idempotency fallback.
    await integrationSet("admin-receipt:" + id, { actor, fingerprint }, 365 * 86400);
    return { view: view(result.state, live.digest), credentials: result.credentials };
  });
}
export async function preparePublication(expected: string, actor: string) {
  const { state, live } = await working();
  if (state.revision !== expected || state.baseDigest !== live.digest) throw new AdminError("De stand is gewijzigd. Controleer opnieuw.", 409);
  if (!state.bookings.length) throw new AdminError("Er zijn geen nieuwe boekingen.");
  const id = randomBytes(24).toString("hex");
  await integrationSet("admin-review:" + id, { revision: state.revision, baseDigest: live.digest, actor }, 600);
  const snapshot = projectAdministration(state);
  return { id, revision: state.revision, bookings: state.bookings.map(({ label, actor, at }) => ({ label, actor, at })), funds: [1, 2, 3].map(f => ({ fund: f, members: snapshot.members.filter(m => m.fund === f && m.active).length, positions: snapshot.positions.filter(p => p.fund === f).length, cash: snapshot.cash.find(c => c.fund === f), units: snapshot.totalUnitsByFund?.[f as 1 | 2 | 3] })) };
}
export async function publishReviewed(id: string, actor: string) {
  if (!/^[a-f0-9]{48}$/.test(id)) throw new AdminError("Ongeldige voorvertoning.");
  return withWriter(async () => {
    const review = await integrationGet<{ revision: string; baseDigest: string; actor: string }>("admin-review:" + id);
    if (!review || review.actor !== actor) throw new AdminError("De voorvertoning is verlopen. Controleer opnieuw.", 410);
    const { state, live } = await working();
    if (live.administration?.revision === review.revision) return { published: true, revision: review.revision };
    if (review.revision !== state.revision || review.baseDigest !== live.digest) throw new AdminError("Sinds de controle is de stand gewijzigd. Controleer opnieuw.", 409);
    const snapshot = projectAdministration(state);
    snapshot.administration = { revision: state.revision };
    await publishAdministration(snapshot, review.baseDigest, review.revision);
    return { published: true, revision: state.revision };
  });
}
