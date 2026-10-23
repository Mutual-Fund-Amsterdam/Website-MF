import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),values=new Map(),locks=new Map(),calls=[];
let snapshot=null,published=0,version='v1',invalid=false,missing=false;
const store={
 integrationGet:async k=>structuredClone(values.get(k)??null),integrationSet:async(k,v)=>values.set(k,structuredClone(v)),
 integrationLock:async k=>{if(locks.has(k))return null;const t='lease';locks.set(k,t);return t;},integrationUnlock:async(k,t)=>{if(locks.get(k)===t)locks.delete(k);},
 pepper:()=> 'fixture-encryption-key-with-adequate-length',getSnapshot:async()=>snapshot,recordOperation:async()=>{},
 savePending:async s=>{values.set('pending',s);return 'pending';},publishPending:async()=>{snapshot=values.get('pending');published++;return snapshot;},
};
const workbook={parseWorkbook:async bytes=>{if(invalid)throw Error('Ongeldige invoer');return {digest:bytes.toString()};}};
const source=await fs.readFile(new URL('../lib/portal/onedrive.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};new Function('require','module','exports',compiled)(p=>p==='server-only'?{}:p==='./store'?store:p==='./workbook'?workbook:p==='./xlsx-results'?{patchRiskResults:()=>{throw Error('No risk report in this fixture');}}:require(p),module,module.exports);
const drive=module.exports,oldFetch=globalThis.fetch;
const oldEnv={...process.env};process.env.ONEDRIVE_CLIENT_ID='fixture-client';process.env.ONEDRIVE_CLIENT_SECRET='fixture-secret';process.env.MF_SITE_URL='https://fixture.example';
globalThis.fetch=async (input,init={})=>{
 const u=new URL(input);calls.push(u.pathname);
 if(u.hostname==='login.microsoftonline.com')return Response.json({access_token:'fixture-access',refresh_token:'fixture-refresh',expires_in:3600});
 assert.equal(u.hostname,'graph.microsoft.com','Only Microsoft hosts may be requested');
 if(u.pathname==='/v1.0/me/drive')return Response.json({id:'drive',owner:{user:{id:'owner'}}});
 if(u.pathname.includes('/me/drive/root:'))return Response.json({id:'folder'});
 if(u.pathname.includes('/me/drive/items/folder:'))return Response.json({id:'master',name:'Website invoer - MASTER.xlsx',file:{},size:123});
 if(u.pathname==='/v1.0/subscriptions'&&init.method==='POST'){const b=JSON.parse(init.body);assert.equal(b.resource,'me/drive/items/folder');assert.equal(b.notificationUrl,'https://fixture.example/api/portal/onedrive/notify');return Response.json({id:'sub',expirationDateTime:b.expirationDateTime});}
 if(u.pathname==='/v1.0/subscriptions/sub')return Response.json({id:'sub'});
 if(u.pathname==='/v1.0/drives/drive/items/master/content')return new Response(version);
 if(u.pathname==='/v1.0/drives/drive/items/master')return missing?new Response(null,{status:404}):Response.json({id:'master',name:'Website invoer - MASTER.xlsx',file:{},size:123,eTag:version});
 throw Error('Unexpected Microsoft request');
};
try{
 await drive.connectDrive('fixture-code','fixture-verifier');assert.equal(published,1);assert.equal(snapshot.digest,'v1');
 const encrypted=values.get('onedrive-token');assert.ok(!encrypted.includes('fixture-refresh')&&!encrypted.includes('fixture-access'));
 const contentCount=()=>calls.filter(p=>p.endsWith('/content')).length;
 const first=contentCount();await drive.syncOneDrive();assert.equal(contentCount(),first,'Unchanged ETag avoids another download');
 version='v2';await Promise.all(Array.from({length:20},()=>drive.syncOneDrive()));assert.equal(published,2,'Concurrent duplicate notifications publish once');assert.equal(contentCount(),first+1);
 version='v3';invalid=true;await drive.syncOneDrive();assert.equal(published,2);assert.equal(snapshot.digest,'v2');assert.equal(values.get('onedrive-dirty'),true);assert.equal(values.get('onedrive').error,'Ongeldige invoer');
 invalid=false;await drive.syncOneDrive();assert.equal(published,3);assert.equal(values.get('onedrive').error,undefined,'Recovery clears the error');
 missing=true;await drive.syncOneDrive();assert.equal(snapshot.digest,'v3','Missing or renamed file never replaces good data');missing=false;
 const c=values.get('onedrive');c.subscriptionExpires=new Date(Date.now()-1000).toISOString();values.set('onedrive',c);await drive.maintainOneDrive();assert.ok(calls.some(p=>p==='/v1.0/subscriptions/sub'));
 assert.ok(calls.every(p=>!p.includes('marketstack')));console.log('OneDrive: encrypted credentials, fixed master ID, ETag reuse, 20 concurrent notifications, invalid input retention, recovery and renewal passed with mocked Microsoft only.');
}finally{globalThis.fetch=oldFetch;for(const k of ['ONEDRIVE_CLIENT_ID','ONEDRIVE_CLIENT_SECRET','MF_SITE_URL'])if(oldEnv[k]===undefined)delete process.env[k];else process.env[k]=oldEnv[k];}
