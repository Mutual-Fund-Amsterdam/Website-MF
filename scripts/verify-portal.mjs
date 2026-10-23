import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import readExcelFile from 'read-excel-file/node';
import {parseWorkbook} from '../lib/portal/workbook.ts';
import {createLocalStore} from '../lib/portal/local-store.ts';
process.loadEnvFile('.env.local');
assert.equal(process.env.MF_LOCAL_PREVIEW,'1');
const local=createLocalStore(process.env.MF_AUTH_PEPPER),prefix='mf:portal:development:';
const bytes=await fs.readFile('../outputs/fondsoptimalisatie/Website invoer - MASTER.xlsx');
const snapshot=await parseWorkbook(bytes,process.env.MF_AUTH_PEPPER);
const old=await local.get(prefix+'current');if(old)await local.set(prefix+'before-optimization',old);
await local.set(prefix+'current',snapshot);
const risk=JSON.parse(await fs.readFile('../.codex-build/risk-sources.json','utf8'));
const fund=JSON.parse(await fs.readFile('../.codex-build/fund-data.json','utf8'));
const oldQuotes=await local.get(prefix+'daily-quotes');
// Only real, dated source observations are supplied to the local preview.
await local.set(prefix+'daily-quotes',{...oldQuotes,fetchedAt:oldQuotes?.fetchedAt??new Date().toISOString(),prices:oldQuotes?.prices??{},benchmark:oldQuotes?.benchmark??{name:'S&P 500',points:fund.benchmark,latest:fund.benchmark.at(-1)},eurUsdHistory:risk.fx.map(p=>({date:p.date,close:p.value})),estrHistory:risk.estr.map(p=>({date:p.date,close:p.value}))});
const sheets=await readExcelFile(bytes);const access=sheets.find(s=>s.sheet==='Leden & toegang');
const hi=access.data.findIndex(r=>r.includes('Persoonlijke code')),header=access.data[hi];
const col=n=>header.indexOf(n),rows=access.data.slice(hi+1);
const admin=rows.find(r=>r[col('Rol')]==='Hoofdbestuurder');
const member=rows.find(r=>r[col('Rol')]==='Lid');
const base='http://127.0.0.1:4186';
async function login(row){const r=await fetch(base+'/api/portal/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({memberId:row[col('Lid-ID')],code:row[col('Persoonlijke code')]})});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];}
const unauth=await fetch(base+'/api/portal/feedback',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({fund:1,text:'test'})});assert.equal(unauth.status,401);
const adminCookie=await login(admin),memberCookie=await login(member);
const text='Lokale controle '+randomBytes(8).toString('hex');
const before=await local.get(prefix+'feedback-count')??0;
try{
 const posted=await fetch(base+'/api/portal/feedback',{method:'POST',headers:{Origin:base,Cookie:memberCookie,'Content-Type':'application/json'},body:JSON.stringify({fund:Number(member[col('Fonds')]),text})});assert.equal(posted.status,200);
 const count=await local.get(prefix+'feedback-count');assert.equal(count,before+1);
 assert.equal((await local.get(prefix+'feedback:'+count)).text,text,'Feedback persisted');
 const hidden=await fetch(base+'/beheer/feedback',{headers:{Cookie:memberCookie},redirect:'manual'});assert.equal(hidden.status,307);
 const visible=await fetch(base+'/beheer/feedback',{headers:{Cookie:adminCookie}});assert.equal(visible.status,200);assert.ok((await visible.text()).includes(text));
 const wrong=await fetch(base+'/api/portal/feedback',{method:'POST',headers:{Origin:base,Cookie:memberCookie,'Content-Type':'application/json'},body:JSON.stringify({fund:Number(member[col('Fonds')])===1?2:1,text})});assert.equal(wrong.status,400);
 const csrf=await fetch(base+'/api/portal/feedback',{method:'POST',headers:{Origin:'https://example.com',Cookie:adminCookie,'Content-Type':'application/json'},body:'{}'});assert.equal(csrf.status,403);
 const page=await fetch(base+'/mijn-fonds',{headers:{Cookie:adminCookie}});assert.equal(page.status,200);const html=await page.text();assert.ok(html.includes('Fondsrendement.'));assert.ok(html.includes('Feedback geven'));assert.ok(!html.includes('<h2>S&amp;P 500.</h2>'));
 await fs.writeFile('../.codex-build/preview-session.json',JSON.stringify({cookie:adminCookie}));
 console.log({members:snapshot.members.length,positions:snapshot.positions.length,fund2Net:snapshot.members.filter(m=>m.fund===2).reduce((s,m)=>s+m.deposits-m.withdrawals,0),checks:'login, persistence, admin access, ordinary-member denial, fund isolation, CSRF, fund page and benchmark section passed'});
}finally{const count=await local.get(prefix+'feedback-count')??before;for(let id=before+1;id<=count;id++)await local.del(prefix+'feedback:'+id);await local.set(prefix+'feedback-count',before);}
