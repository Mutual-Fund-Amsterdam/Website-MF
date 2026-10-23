import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),values=new Map(),locks=new Set(),calls=[];
let fileVersion='v1',fileDigest='input',snapshot=null,commits=0,race=false,newRisk=false,commitRace=false;
const store={integrationGet:async k=>structuredClone(values.get(k)??null),integrationSet:async(k,v)=>values.set(k,structuredClone(v)),integrationLock:async k=>{if(locks.has(k))return null;locks.add(k);return 'lease';},integrationUnlock:async k=>locks.delete(k),pepper:()=> 'fixture-encryption-key-not-production',getSnapshot:async()=>snapshot,recordOperation:async()=>{},savePending:async s=>{values.set('pending',s);return 'pending';},publishPending:async()=>{snapshot=values.get('pending');return snapshot;}};
const workbook={parseWorkbook:async()=>({digest:fileDigest})};
const source=await fs.readFile(new URL('../lib/portal/onedrive.ts',import.meta.url),'utf8'),compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};
new Function('require','module','exports',compiled)(p=>p==='server-only'?{}:p==='./store'?store:p==='./workbook'?workbook:p==='./xlsx-results'?{patchRiskResults:()=>Buffer.from('new-results')}:require(p),module,module.exports);
const drive=module.exports,oldFetch=globalThis.fetch,oldEnv={...process.env};process.env.ONEDRIVE_CLIENT_ID='fixture';process.env.ONEDRIVE_CLIENT_SECRET='fixture';process.env.MF_SITE_URL='https://fixture.example';
globalThis.fetch=async(input,init={})=>{
 const url=new URL(input);calls.push({host:url.hostname,path:url.pathname,method:init.method??'GET'});
 if(url.hostname==='login.microsoftonline.com'){assert.ok(init.body.get('scope').includes('Files.ReadWrite'));return Response.json({access_token:'access',refresh_token:'refresh',expires_in:3600});}
 if(url.hostname==='upload.1drv.com'){
  assert.equal(new Headers(init.headers).get('Authorization'),null,'No token sent to upload URL');
  if(init.method==='DELETE')return new Response(null,{status:204});
  assert.equal(init.method,'PUT');if(race)fileVersion='user-edit';if(newRisk)values.set('risk:input',{version:'newer',inputDigest:'input'});return Response.json({nextExpectedRanges:[]},{status:202});
 }
 assert.equal(url.hostname,'graph.microsoft.com');const path=url.pathname;
 if(path==='/v1.0/me/drive')return Response.json({id:'drive',owner:{user:{id:'owner'}}});
 if(path.includes('/me/drive/root:'))return Response.json({id:'folder'});
 if(path.includes('/me/drive/items/folder:'))return Response.json({id:'master',file:{},size:10});
 if(path==='/v1.0/subscriptions')return Response.json({id:'subscription',expirationDateTime:new Date(Date.now()+7*86400000).toISOString()});
 if(path.endsWith('/createUploadSession')){assert.equal(init.headers['If-Match'],fileVersion);assert.equal(JSON.parse(init.body).deferCommit,true);return Response.json({uploadUrl:'https://upload.1drv.com/session'});}
 if(path.endsWith('/content'))return new Response('workbook');
 if(path.endsWith('/items/master')){
  if(init.method==='PUT'){assert.ok(JSON.parse(init.body)['@microsoft.graph.sourceUrl']);if(commitRace)fileVersion='edit-at-final-commit';if(init.headers['If-Match']!==fileVersion)return new Response(null,{status:412});commits++;fileVersion='output-'+commits;return Response.json({id:'master',eTag:fileVersion});}
  return Response.json({id:'master',name:'Website invoer - MASTER.xlsx',file:{},size:10,eTag:fileVersion});
 }
 throw Error('Unexpected request '+path);
};
try{
 await drive.connectDrive('fixture-code','fixture-verifier');assert.equal(snapshot.digest,'input');
 values.set('risk:input',{version:'risk-v1',inputDigest:'input'});values.set('onedrive-results-pending',true);
 await drive.writeOneDriveResults();assert.equal(commits,1);assert.equal(values.get('onedrive-results-pending'),false);assert.equal(values.get('onedrive').etag,fileVersion);
 const count=calls.length;await drive.syncOneDrive();assert.equal(commits,1);assert.equal(calls.length,count+1,'Own output notification reads only ETag and does not write again');
 race=true;values.set('onedrive-results-pending',true);await drive.writeOneDriveResults();assert.equal(commits,1);assert.equal(fileVersion,'user-edit');assert.equal(values.get('onedrive-results-pending'),true);assert.match(values.get('onedrive').writeError,/412/);assert.ok(calls.some(c=>c.method==='DELETE'));
 race=false;await drive.writeOneDriveResults();assert.equal(commits,2);assert.equal(values.get('onedrive').writeError,undefined);
 commitRace=true;values.set('onedrive-results-pending',true);await drive.writeOneDriveResults();assert.equal(commits,2,'Final commit, not only session creation, is conditional');commitRace=false;
 newRisk=true;values.set('onedrive-results-pending',true);await drive.writeOneDriveResults();assert.equal(commits,3);assert.equal(values.get('onedrive-results-pending'),true,'Newer calculation remains pending');newRisk=false;
 fileDigest='unprocessed-input';await drive.writeOneDriveResults();assert.equal(commits,3,'Never overwrite pending financial inputs');
 assert.ok(calls.every(c=>!c.host.includes('marketstack')));
 console.log('OneDrive writeback: Files.ReadWrite, deferred upload, final If-Match races, cancellation, recovery, output-loop avoidance, newer calculation and pending-input protection passed. Mock Microsoft only.');
}finally{globalThis.fetch=oldFetch;for(const k of ['ONEDRIVE_CLIENT_ID','ONEDRIVE_CLIENT_SECRET','MF_SITE_URL'])if(oldEnv[k]===undefined)delete process.env[k];else process.env[k]=oldEnv[k];}
