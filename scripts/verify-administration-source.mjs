import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseWorkbook } from '../lib/portal/workbook.ts';
import { newAdministration, projectAdministration } from '../lib/portal/admin/engine.ts';
import { view } from '../lib/portal/admin/storage.ts';
import { membershipRegister } from '../lib/portal/admin/register.ts';
const [path,archivePath,rosterPath]=process.argv.slice(2);
if(!path)throw Error('Supply a source workbook path. Read-only check, no store or upload.');
const bytes=await readFile(path),before=createHash('sha256').update(bytes).digest('hex');
const original=await parseWorkbook(bytes,'read-only-reconciliation-pepper-not-a-production-key');
let state=newAdministration(original);
if(rosterPath){const {readRoster}=await import("../lib/portal/admin/roster.ts");state=await readRoster(await readFile(rosterPath),state);assert.deepEqual(state.base.positions,original.positions);assert.deepEqual(state.base.cash,original.cash);assert.deepEqual(state.base.totalUnitsByFund,original.totalUnitsByFund);}
if(archivePath)state.archive=[...JSON.parse(await readFile(archivePath,'utf8')).rows,...state.archive];
const projected=projectAdministration(state); if(!rosterPath)assert.deepEqual(projected,original,'Opening the administration must exactly preserve the source');
const data=view(state,original.digest),register=membershipRegister(data);
assert.equal(before,createHash('sha256').update(await readFile(path)).digest('hex'));
console.log(JSON.stringify({sourceUnchanged:true,serializedBytes:JSON.stringify(state).length,members:original.members.length,active:original.members.filter(m=>m.active).length,register:register.length,archiveReferences:state.archive.length,positions:original.positions.length,trades:data.trades.length,funds:[1,2,3].map(f=>({fund:f,members:original.members.filter(m=>m.fund===f).length,units:original.totalUnitsByFund?.[f],ing:original.cash.find(c=>c.fund===f)?.ingEur,saxo:original.cash.find(c=>c.fund===f)?.brokerEur}))},null,2));
