import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),values=new Map();
const redis={get:async k=>values.get(k)??null,set:async(k,v,options)=>{if(options?.nx&&values.has(k))return null;values.set(k,v);return 'OK';},incr:async k=>{const n=(values.get(k)??0)+1;values.set(k,n);return n;},incrby:async(k,d)=>{const n=(values.get(k)??0)+d;values.set(k,n);return n;},del:async k=>values.delete(k),expire:async()=>true};
const old={...process.env};process.env.MF_LOCAL_PREVIEW='1';process.env.MF_AUTH_PEPPER='fixture-secret-not-used-in-production-0123456789';delete process.env.VERCEL;
const month=new Date().toISOString().slice(0,7);process.env.MARKETSTACK_USAGE_BASELINE=month+':0';
const source=await fs.readFile(new URL('../lib/portal/store.ts',import.meta.url),'utf8'),compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};
new Function('require','module','exports',compiled)(p=>p==='node:crypto'?require(p):p==='./local-store'?{createLocalStore:()=>redis}:{},module,module.exports);
try{
 const attempts=await Promise.all(Array.from({length:150},(_,i)=>module.exports.claimRiskHistoryCredit('fixture-'+i)));
 assert.equal(attempts.filter(Boolean).length,100,'Atomic monthly cap with 150 concurrent claimants');
 const duplicates=await Promise.all(Array.from({length:100},(_,i)=>module.exports.claimRiskHistoryCredit('fixture-'+i)));assert.equal(duplicates.filter(Boolean).length,0,'Claimed instruments do not reserve a second credit');
 assert.equal([...values].find(([k])=>k.includes('marketstack-usage:'))[1],100);
 assert.equal([...values].find(([k])=>k.includes('risk-history-budget:'))[1],100);
 values.clear();process.env.MARKETSTACK_USAGE_BASELINE=month+':9999';assert.equal(await module.exports.claimRiskHistoryCredit('over-total-budget'),false,'Global cap also applies');
 assert.equal([...values].find(([k])=>k.includes('risk-history-budget:'))[1],0);assert.ok(![...values.keys()].some(k=>k.includes('risk-history-attempt:')),'No request sent: next daily run may retry after budget repair');
 console.log('Actual reservation code: 150 concurrent claims reserve exactly 100 credits, duplicate claims cost zero, global cap blocks and releases unused reservations. In-memory store; no network.');
}finally{for(const key of ['MF_LOCAL_PREVIEW','MF_AUTH_PEPPER','VERCEL','MARKETSTACK_USAGE_BASELINE'])if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}
