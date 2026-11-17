import "server-only";
import { gzipSync, gunzipSync } from "node:zlib";
import { randomBytes } from "node:crypto";
import { validateInputContinuity } from "../input-workbook";
import type { Snapshot } from "../types";
import type { Administration } from "./model";
import { catalogFor, ensure, newAdministration, projectAdministration } from "./engine";
import { seal, unseal } from "./crypto";

/** Independent encrypted administration backup; never includes MFA secrets or raw login codes. */
export function exportBackup(state: Administration) {
  return Buffer.from(JSON.stringify({ format: "MF-BACKUP-1", payload: seal({ gzip: gzipSync(Buffer.from(JSON.stringify(state))).toString("base64") }, "MF-BACKUP-1") }));
}
export function importBackup(bytes: Buffer, current: Administration) {
  const envelope = JSON.parse(bytes.toString());
  ensure(envelope.format === "MF-BACKUP-1" && typeof envelope.payload === "string", "Ongeldige back-up.");
  const decoded = unseal<Administration | { gzip: string }>(envelope.payload, "MF-BACKUP-1");
  const saved: Administration = "gzip" in decoded ? JSON.parse(gunzipSync(Buffer.from(decoded.gzip, "base64"), { maxOutputLength: 12_000_000 }).toString()) : decoded;
  ensure(saved.schema === 1 && Array.isArray(saved.bookings) && Array.isArray(saved.archive), "Ongeldige back-upversie.");
  return restoredAdministration(saved, current);
}
export function restoredAdministration(saved: Administration, current: Administration): Administration {
  const restored = projectAdministration(saved), now = projectAdministration(current);
  validateInputContinuity(restored, now);
  ensure(now.members.every(m => restored.members.some(p => p.key === m.key)), "De export mist bestaande leden. Gebruik een recentere export.");
  retainAccess(restored, now);
  // Keep the complete previous audit alongside the import event; restoring is a new change.
  const audit = [...current.audit, ...current.bookings].map(({ id, actor, at, label }) => ({ id, actor, at, label }));
  return { ...newAdministration(restored), baseDigest: current.baseDigest, revision: randomBytes(32).toString("hex"), catalog: catalogFor(saved), archive: saved.archive, audit };
}

export function retainAccess(restored: Snapshot, now: Snapshot) {
  for (const member of restored.members) {
    const existing = now.members.find(p => p.key === member.key);
    if (existing) {
      ensure(member.role === existing.role && [...member.allowedFunds].sort().join() === [...existing.allowedFunds].sort().join(), "Rollen en fondstoegang worden buiten de bestuursinvoer beheerd. Behoud de bestaande toegangsrechten.");
      member.loginDigest = existing.loginDigest;
    } else ensure(member.role === "Lid" && member.allowedFunds.length === 1 && member.allowedFunds[0] === member.fund, "Nieuwe bestuursrechten worden buiten de invoerroute beheerd.");
  }
}
