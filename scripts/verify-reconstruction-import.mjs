import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import readExcelFile from 'read-excel-file/node';
import {createLocalStore} from '../lib/portal/local-store.ts';
process.loadEnvFile('.env.local');
assert.equal(process.env.MF_LOCAL_PREVIEW,'1');assert.ok(!process.env.VERCEL);
const local=createLocalStore(process.env.MF_AUTH_PEPPER),prefix='mf:portal:development:';
const bytes=await fs.readFile('../outputs/fondsreconstructie/Website invoer - MASTER.xlsx');
const access=(await readExcelFile(bytes)).find(s=>s.sheet==='Leden & toegang');
const hi=access.data.findIndex(r=>r.includes('Persoonlijke code')),header=access.data[hi],col=n=>header.indexOf(n),rows=access.data.slice(hi+1);
const admin=rows.find(r=>r[col('Rol')]==='Hoofdbestuurder'),member=rows.find(r=>r[col('Rol')]==='Lid');
const base='http://127.0.0.1:4186';
async function login(row){const r=await fetch(base+'/api/portal/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({memberId:row[col('Lid-ID')],code:row[col('Persoonlijke code')]})});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];}
const before=await local.get(prefix+'current');assert.ok(before,'Existing local preview required');
await local.set(prefix+'before-reconstruction',before);
let cookie=await login(admin);
const denied=await fetch(base+'/api/portal/reconstruction?fonds=1');assert.equal(denied.status,403);
for(let i=0;i<2;i++){
 const form=new FormData();form.set('file',new File([bytes],'Website invoer - MASTER.xlsx'));
 const preview=await fetch(base+'/api/portal/import/preview',{method:'POST',headers:{Origin:base,Cookie:cookie},body:form});
 const result=await preview.json();assert.equal(preview.status,200,JSON.stringify(result));
 const publish=await fetch(base+'/api/portal/import/commit',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({id:result.id})});
 assert.equal(publish.status,200,await publish.text());
 cookie=await login(admin);
 const stored=await local.get(prefix+'current');assert.ok(stored.ledgerStorage);assert.ok(!stored.ledger);
 assert.equal(stored.ledgerStorage.bankChunks,6);assert.equal(stored.ledgerStorage.brokerChunks,17);
 const audit=await local.get(prefix+`reconstruction:${stored.digest}:audit`);assert.equal(audit.bankRows,522);assert.equal(audit.brokerRows,1696);
}
const visible=await fetch(base+'/beheer/reconstructie',{headers:{Cookie:cookie}});assert.equal(visible.status,200);assert.ok((await visible.text()).replaceAll('<!-- -->','').includes('522 ING-mutaties'));
const exportCsv=await fetch(base+'/api/portal/reconstruction?fonds=1',{headers:{Cookie:cookie}});assert.equal(exportCsv.status,200);
assert.ok((await exportCsv.text()).includes('2026-10-21'));
const memberCookie=await login(member);
assert.equal((await fetch(base+'/beheer/reconstructie',{headers:{Cookie:memberCookie},redirect:'manual'})).status,307);
assert.equal((await fetch(base+'/api/portal/reconstruction?fonds=1',{headers:{Cookie:memberCookie}})).status,403);
const ordinary=await fetch(base+'/mijn-fonds',{headers:{Cookie:memberCookie}});assert.equal(ordinary.status,200);const html=await ordinary.text();assert.ok(!html.includes('Bronhash'));assert.ok(!html.includes('rekeningnummer'));
await fs.writeFile('../.codex-build/preview-session.json',JSON.stringify({cookie}));
console.log('Passed locally: actual upload + commit twice, sharded encrypted source storage, 522/1696 rows unchanged, admin review + CSV, ordinary-member denial and fund page. No provider calls.');
