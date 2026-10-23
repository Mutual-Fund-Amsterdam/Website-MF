import assert from 'node:assert/strict';
import {fillRiskHistory} from '../lib/portal/risk-history.ts';
const positions=Array.from({length:6},(_,i)=>({fund:1,ticker:'AAA'+i,name:'Fixture',quantity:1,currency:'USD',exchange:'Nasdaq',isin:'',tradingViewSymbol:''})),snapshot={positions};
let sent=0,saved=0,used=0;const attempts=new Set(),oldFetch=globalThis.fetch;
const claim=async id=>{if(attempts.has(id)||used>=100)return false;attempts.add(id);used++;return true;};
globalThis.fetch=async input=>{const u=new URL(input);assert.equal(u.hostname,'api.marketstack.com');assert.equal(u.searchParams.get('date_from'),'2025-10-22');assert.equal(u.searchParams.get('date_to'),'2026-10-22');assert.ok(!u.searchParams.has('offset'));sent++;return Response.json({data:[{symbol:u.searchParams.get('symbols'),exchange:u.searchParams.get('symbols')==='GSPC.INDX'?'INDX':'XNAS',price_currency:'USD',date:'2026-10-22',close:100,adj_close:100}],pagination:{total:1}});};
try{
 const quotes={prices:{}};assert.equal(await fillRiskHistory(snapshot,quotes,'fixture',claim,async()=>{saved++;},new Date('2026-10-23T05:15:00Z')),3);assert.equal(sent,3);assert.equal(saved,3);
 assert.equal(await fillRiskHistory(snapshot,quotes,'fixture',claim,async()=>{},new Date('2026-10-23T05:15:00Z')),3);assert.equal(sent,6,'Already attempted symbols are not retried');
 used=100;assert.equal(await fillRiskHistory(snapshot,quotes,'fixture',claim,async()=>{},new Date('2026-10-23T05:15:00Z')),0);assert.equal(sent,6,'Monthly ceiling stops requests before fetch');
 assert.equal(attempts.size,6);console.log('Risk history queue: one-year window, three attempts per run, cached merges, no pagination/retries and 100-credit cap passed. Mock Marketstack only.');
}finally{globalThis.fetch=oldFetch;}
