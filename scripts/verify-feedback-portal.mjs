import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import readExcelFile from 'read-excel-file/node';
import {createLocalStore} from '../lib/portal/local-store.ts';

// Explicit local fixture only. Never send test feedback or credentials to production.
const workbook=process.argv[2];assert.ok(workbook,'Pass a local test workbook');
const base='http://127.0.0.1:4173';process.loadEnvFile('.env.local');
assert.equal(process.env.MF_LOCAL_PREVIEW,'1');assert.ok(!process.env.VERCEL);
const local=createLocalStore(process.env.MF_AUTH_PEPPER),prefix='mf:portal:development:';
const sheets=await readExcelFile(await fs.readFile(workbook)),access=sheets.find(s=>s.sheet==='Toegang');
const hi=access.data.findIndex(r=>r.includes('Persoonlijke code')),header=access.data[hi],col=n=>header.indexOf(n);
const rows=access.data.slice(hi+1),admins=rows.filter(r=>r[col('Rol')]==='Hoofdbestuurder');
const member=rows.find(r=>r[col('Rol')]==='Lid');assert.equal(admins.length,3);assert.ok(member);
const cookies=[],before=await local.get(prefix+'feedback-count')??0,operations=await local.get(prefix+'operations-count')??0;
const ip='feedback-fixture-'+randomBytes(8).toString('hex');
async function login(row){
 const r=await fetch(base+'/api/portal/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json','x-forwarded-for':ip},body:JSON.stringify({memberId:row[col('Lid-ID')],code:row[col('Persoonlijke code')]})});
 assert.equal(r.status,200);const cookie=r.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');cookies.push(cookie);return cookie;
}
try{
 const anonymous=await fetch(base+'/api/portal/feedback',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'});assert.equal(anonymous.status,401);
 const memberCookie=await login(member),text='Lokale feedbackcontrole '+randomBytes(8).toString('hex')+' <script>geen uitvoering</script>';
 const submit=await fetch(base+'/api/portal/feedback',{method:'POST',headers:{Origin:base,Cookie:memberCookie,'Content-Type':'application/json','x-forwarded-for':ip},body:JSON.stringify({fund:Number(member[col('Fonds')]),text,memberId:'FAKE',name:'Valse afzender'})});assert.equal(submit.status,200);
 const count=await local.get(prefix+'feedback-count');assert.equal(count,before+1);
 const saved=await local.get(prefix+'feedback:'+count);assert.equal(saved.memberId,String(member[col('Lid-ID')]));assert.equal(saved.text,text);assert.notEqual(saved.name,'Valse afzender');
 const denied=await fetch(base+'/beheer/feedback',{headers:{Cookie:memberCookie},redirect:'manual'});assert.equal(denied.status,307);assert.equal(denied.headers.get('location'),'/mijn-fonds');
 const memberPage=await fetch(base+'/mijn-fonds',{headers:{Cookie:memberCookie}});assert.equal(memberPage.status,200);assert.ok(!(await memberPage.text()).includes('Ontvangen feedback van leden'));
 for(const admin of admins){
  const cookie=await login(admin);
  const inbox=await fetch(base+'/beheer/feedback',{headers:{Cookie:cookie}});assert.equal(inbox.status,200);const html=await inbox.text();
  assert.ok(html.includes('Feedback van leden.'));assert.ok(html.includes('Lid-ID:'));assert.ok(html.includes(saved.memberId));assert.ok(html.includes(saved.name));assert.ok(html.includes('&lt;script&gt;geen uitvoering&lt;/script&gt;'));
  const fund=await fetch(base+'/mijn-fonds',{headers:{Cookie:cookie}});assert.equal(fund.status,200);const fundHtml=await fund.text();
  assert.ok(fundHtml.includes('Ontvangen feedback van leden'));assert.ok(fundHtml.includes('Huidige portefeuille — model'));assert.ok(fundHtml.includes('Historisch fonds'));assert.ok(fundHtml.includes('Portefeuillebeta'));assert.ok(!fundHtml.includes('Koers- of valutahistorie voor de huidige portefeuille is onvolledig.'));
  if(admin===admins[0])for(const path of ['/beheer/import','/beheer/feedback','/beheer/reconstructie','/beheer/koppelingen']){
   const page=await fetch(base+path,{headers:{Cookie:cookie}});assert.equal(page.status,200,path);assert.ok((await page.text()).includes('← Terug naar mijn fonds'),path+' has a return link');
   const back=await fetch(base+'/mijn-fonds',{headers:{Cookie:cookie}});assert.equal(back.status,200,path+' return is accessible');
  }
 }
 const end=await local.get(prefix+'operations-count')??0;for(let i=operations+1;i<=end;i++)assert.ok(!(await local.get(prefix+'operation:'+i))?.credits,'No Marketstack credits for feedback or page visits');
 console.log('Local HTTP: sender from session (spoof ignored), feedback visible to three administrators, denied to member, escaped message, two risk models, clear beta label and zero Marketstack credits. Test feedback removed.');
}finally{
 for(const cookie of cookies)await fetch(base+'/api/portal/logout',{method:'POST',headers:{Origin:base,Cookie:cookie}});
 const end=await local.get(prefix+'feedback-count')??before;for(let id=before+1;id<=end;id++)await local.del(prefix+'feedback:'+id);await local.set(prefix+'feedback-count',before);
}
