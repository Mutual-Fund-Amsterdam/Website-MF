import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fixturePepper, fixtureCode } from './fixtures/administration.mjs';
import { totp } from '../lib/portal/admin/crypto.ts';
const origin = 'http://127.0.0.1:49732';
function client() {
 const jar = new Map();
 return { jar, async request(path, body, extra = {}) {
   const response = await fetch(origin + path, { method: body === undefined ? 'GET':'POST', headers: { Origin:origin, Cookie:[...jar].map(([k,v])=>k+'='+v).join('; '), ...(body===undefined || body instanceof FormData ? {}:{'Content-Type':'application/json'}), ...extra }, body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body), redirect:'manual' });
   for (const cookie of response.headers.getSetCookie()) { const pair=cookie.split(';')[0],at=pair.indexOf('='); jar.set(pair.slice(0,at),pair.slice(at+1)); }
   return response;
 } };
}
async function json(response, expected=200) { assert.equal(response.status,expected, await response.clone().text()); return response.json(); }
const admin1=client(),admin2=client(),member=client(),guest=client();
for (const [c,id] of [[admin1,'F1-001'],[admin2,'F2-001'],[member,'F1-002']]) await json(await c.request('/api/portal/login',{memberId:id,code:fixtureCode}));
const endpoints=[['state'],['export'],['backup'],['book',{}],['review',{}],['publish',{}],['import',new FormData()]];
for(const [path,body]of endpoints){await json(await guest.request('/api/portal/admin/'+path,body),401);await json(await member.request('/api/portal/admin/'+path,body),403);await json(await admin1.request('/api/portal/admin/'+path,body),428);}
await json(await member.request('/api/portal/admin/mfa'),403);
const recovery=[];
for(const c of [admin1,admin2]){
 const setup=await json(await c.request('/api/portal/admin/mfa',{action:'setup',password:fixtureCode}));
 const code=totp(setup.secret,Math.floor(Date.now()/30000));
 const verified=await json(await c.request('/api/portal/admin/mfa',{action:'verify',code})); assert.equal(verified.recoveryCodes.length,8); recovery.push(verified.recoveryCodes);
 await json(await c.request('/api/portal/admin/mfa',{action:'verify',code}),401);
 assert.ok((await c.request('/api/portal/admin/state')).headers.get('cache-control').includes('no-store'));
}
// A stolen step-up cookie cannot authenticate a different login session/account.
const secondLogin=client();await json(await secondLogin.request('/api/portal/login',{memberId:'F1-001',code:fixtureCode}));
secondLogin.jar.set('__Host-mf_admin',admin1.jar.get('__Host-mf_admin'));
await json(await secondLogin.request('/api/portal/admin/state'),428);
await json(await secondLogin.request('/api/portal/admin/mfa',{action:'verify',code:recovery[0][0]}));
await json(await secondLogin.request('/api/portal/admin/mfa',{action:'verify',code:recovery[0][0]}),401);
let a=await json(await admin1.request('/api/portal/admin/state'));
let b=await json(await admin2.request('/api/portal/admin/state'));assert.equal(a.revision,b.revision);
assert.ok(!JSON.stringify(a).includes('loginDigest'));
const input={type:'cash',fund:'2',date:'2026-11-01',bank:'Saxo',currency:'EUR',amount:'2345.67'},id=randomUUID();
await json(await admin1.request('/api/portal/admin/book',{input,id,revision:a.revision},{Origin:'https://malicious.example'}),403);
const saved=await json(await admin1.request('/api/portal/admin/book',{input,id,revision:a.revision}));
await json(await admin2.request('/api/portal/admin/book',{input:{...input,amount:'9999'},id:randomUUID(),revision:b.revision}),409);
b=await json(await admin2.request('/api/portal/admin/state'));assert.equal(b.cash[1].brokerEur,2345.67);
const duplicate=await json(await admin1.request('/api/portal/admin/book',{input,id,revision:a.revision}));assert.equal(duplicate.duplicate,true);
const exported=await admin2.request('/api/portal/admin/export');assert.equal(exported.status,200);assert.ok(exported.headers.get('content-type').includes('spreadsheetml'));
const bytes=await exported.arrayBuffer(),form=new FormData();form.set('file',new File([bytes],'fixture.xlsx'));form.set('revision',b.revision);
const staged=await json(await admin2.request('/api/portal/admin/import',form));assert.equal(staged.members,6);
assert.equal((await json(await admin1.request('/api/portal/admin/state'))).revision,b.revision,'Preview does not mutate');
const confirm=new FormData();confirm.set('confirm',staged.id);confirm.set('revision',b.revision);
await json(await admin1.request('/api/portal/admin/import',confirm),409); // belongs to other board member
const restored=await json(await admin2.request('/api/portal/admin/import',confirm));
const backup=await admin2.request('/api/portal/admin/backup');assert.equal(backup.status,200);assert.ok(!(await backup.text()).includes('Fictief'));
const review=await json(await admin2.request('/api/portal/admin/review',{revision:restored.view.revision}));
await json(await admin1.request('/api/portal/admin/publish',{id:review.id}),410);
await json(await admin2.request('/api/portal/admin/publish',{id:review.id}));
const after=await json(await admin1.request('/api/portal/admin/state'));assert.equal(after.bookings.length,0);assert.equal(after.cash[1].brokerEur,2345.67);assert.equal(after.audit.length,2);
const page=await admin1.request('/beheer/administratie');assert.equal(page.status,200);assert.ok(page.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
assert.ok(!(await (await guest.request('/beheer/administratie')).text()).includes('Fictief Hoofdbestuurder'));
const changed = await json(await admin1.request('/api/portal/admin/book', { input:{...input,amount:'2400'},id:randomUUID(),revision:after.revision }));
const { createLocalStore } = await import('../lib/portal/local-store.ts');
const local = createLocalStore(fixturePepper), live = await local.get('mf:portal:development:current');
assert.ok(live.warnings.includes('Fictieve lokale controleomgeving'));
live.digest='c'.repeat(64);live.cash[2].ingEur=4321;
await local.set('mf:portal:development:current',live);
await json(await admin1.request('/api/portal/admin/book',{input,id:randomUUID(),revision:changed.view.revision}),409);
const rebase=new FormData();rebase.set('source','published');rebase.set('revision',changed.view.revision);
const rebaseReview=await json(await admin1.request('/api/portal/admin/import',rebase));assert.equal(rebaseReview.replacedBookings,1);assert.equal(rebaseReview.cash[2].ingEur,4321);
const rebaseConfirm=new FormData();rebaseConfirm.set('confirm',rebaseReview.id);rebaseConfirm.set('revision',changed.view.revision);
const rebased=await json(await admin1.request('/api/portal/admin/import',rebaseConfirm));assert.equal(rebased.view.baseDigest,live.digest);assert.equal(rebased.view.cash[2].ingEur,4321);
console.log('Passed HTTP: guests and ordinary members denied all admin endpoints; MFA enrollment/replay/recovery/session binding; same-origin; two board accounts; stale edit; exact-once retry; credential-free Excel download/controlled import; encrypted backup; owner-bound review/publication; scoped response headers. Only fictitious localhost data.');
