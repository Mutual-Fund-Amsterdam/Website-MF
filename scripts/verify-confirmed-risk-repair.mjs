import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
let role='Hoofdbestuurder',origin=true,lock=true,finished=true,filled=0,released=0,reported=0,claims=[];
const today=new Date().toISOString().slice(0,10),snapshot={digest:'fixture'},quotes={prices:{}};
const storage={sameOrigin:()=>origin,getMemberSession:async()=>role?{member:{role},snapshot}:null,allowAttempt:async()=>true,historyBatchLock:async()=>lock,releaseHistoryBatch:async()=>released++,operations:async()=>finished?[{runId:'daily:'+today,kind:'daily-result'}]:[],getDailyQuotes:async()=>quotes,saveDailyQuotes:async()=>{},claimRiskHistoryCredit:async(id,now,context)=>{claims.push(context);return true;},refreshRiskReport:async()=>({funds:Object.fromEntries([1,2,3].map(f=>[f,{current:{coverage:1,volatility:.1}}]))}),recordOperation:async()=>reported++};
const source=await fs.readFile(new URL('../app/api/portal/history/current/route.ts',import.meta.url),'utf8'),compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};
new Function('require','module','exports',compiled)(p=>p==='next/server'?{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}}:p.endsWith('/store')?storage:p.endsWith('/marketstack')?{refreshWindow:()=>true}:{fillRiskHistory:async(s,q,key,claim,checkpoint,now,budget)=>{filled++;assert.equal(budget,3);for(let i=0;i<budget;i++)await claim('fixture-'+i);await checkpoint();return budget;}},module,module.exports);
const previous=process.env.MARKETSTACK_API_KEY;process.env.MARKETSTACK_API_KEY='fixture-only';
const request=body=>new Request('https://fixture.test/api/portal/history/current',{method:'POST',body:JSON.stringify(body)}),valid={action:'confirmed-risk-repair',confirmedBudget:3};
try{
 role=null;assert.equal((await module.exports.POST(request(valid))).status,403);role='Lid';assert.equal((await module.exports.POST(request(valid))).status,403);role='Hoofdbestuurder';origin=false;assert.equal((await module.exports.POST(request(valid))).status,403);origin=true;
 assert.equal((await module.exports.POST(request({...valid,confirmedBudget:4}))).status,400);assert.equal(filled,0);
 finished=false;assert.equal((await module.exports.POST(request(valid))).status,409);finished=true;lock=false;assert.equal((await module.exports.POST(request(valid))).status,409);lock=true;
 const result=await module.exports.POST(request(valid));assert.equal(result.status,200);assert.equal(result.body.attempted,3);assert.equal(filled,1);assert.equal(released,1);assert.equal(reported,1);assert.equal(claims.length,3);assert.ok(claims.every(c=>c.cause==='risk-history-confirmed'&&c.runId.startsWith('risk-repair:')));
 console.log('Confirmed history repair: CSRF, member/admin authorization, explicit budget, active daily-run guard, shared lock, labelled reservations, model refresh and release passed. No network.');
}finally{if(previous===undefined)delete process.env.MARKETSTACK_API_KEY;else process.env.MARKETSTACK_API_KEY=previous;}
