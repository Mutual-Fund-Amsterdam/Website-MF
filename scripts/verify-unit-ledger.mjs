import assert from 'node:assert/strict';
import {currentBookPoint} from '../lib/portal/book-valuation.ts';
import {currentFundHistory} from '../lib/portal/current-fund-history.ts';
import {memberHistory} from '../lib/portal/member-history.ts';
import {applyUnitLedger,mergeManualPrices} from '../lib/portal/unit-ledger.ts';
import {fetchDailyQuotes} from '../lib/portal/marketstack.ts';
const RealDate=Date,realFetch=globalThis.fetch;let now='2026-11-09T20:00:00Z';
globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[now]));}static now(){return new RealDate(now).getTime();}};
globalThis.fetch=()=>{throw Error('Valuation must not fetch prices');};
try{
 const s={positions:[],cash:[],members:[],transactions:[],fundHistory:[],totalUnitsByFund:{1:10,2:10,3:10},input:{version:3,cutoff:'2026-10-21',events:{}},ledger:{bank:[],broker:[],members:[]}};
 for(const fund of [1,2,3]){
  s.positions.push({fund,ticker:'AAA',name:'Fixture',quantity:10,currency:'EUR',exchange:'Euronext Amsterdam'});
  s.cash.push({fund,ingEur:100,ingAsOf:'2026-11-09',brokerEur:50,brokerAsOf:'2026-10-13',brokerUsd:0,brokerCad:0,otherEur:10,otherAsOf:'2026-10-05'});
  s.fundHistory.push({fund,date:'2026-10-06',nav:999,totalUnits:9999});
  for(const [suffix,units] of [['A',4],['B',6]]){const id=`F${fund}-${suffix}`;s.members.push({id,fund});s.transactions.push({fund,memberId:id,date:'2026-10-01',amount:units*100,nav:100,units,source:'Source'});}
 }
 const ix=Array.from({length:7},()=>Array(16).fill(null));ix[3][15]='MF-UNITS-1';
 for(const f of [1,2,3]){const r=ix[f+3];r[6]=f;r[11]=new Date('2026-11-09');r[12]=f===3?20:0;r[14]=new Date('2026-11-09');}
 applyUnitLedger(s,[{sheet:'Fondsindex',data:ix}]);
 const q={fetchedAt:'2026-11-09T05:15:00Z',prices:{'Euronext Amsterdam:AAA':{symbol:'AAA',exchange:'XAMS',currency:'EUR',date:'2026-11-06',close:100}},history:{'Euronext Amsterdam:AAA':[{date:'2026-11-06',close:100}]},benchmark:{points:[{date:'2026-11-06',close:100}],latest:{date:'2026-11-06',close:100}}};
 for(const f of [1,2,3]){
  const p=currentBookPoint(s,q,f);assert.equal(p.fundValue,f===3?1140:1160);assert.equal(p.date,'2026-11-09');assert.equal(p.quoteDate,'2026-11-06');
  const values=s.members.filter(m=>m.fund===f).map(m=>memberHistory(m,s,[],[],p).at(-1).value);
  assert.ok(Math.abs(values.reduce((a,b)=>a+b,0)-p.fundValue)<1e-9);
 }
 const changed=structuredClone(s);changed.fundHistory.forEach(p=>{p.nav=123456;p.totalUnits=987654;});
 assert.equal(currentBookPoint(changed,q,2).fundValue,1160,'Legacy administration EUR totals never determine current values');
 const paid=structuredClone(s);paid.cash[2].ingEur-=20;paid.cash[2].payablesEur=0;
 assert.equal(currentBookPoint(paid,q,3).fundValue,currentBookPoint(s,q,3).fundValue,'Cash payment and release of payable do not create a return');
 const broken=structuredClone(s);broken.totalUnitsByFund[1]=9;assert.throws(()=>applyUnitLedger(broken,[{sheet:'Fondsindex',data:ix}]),/sluiten niet aan/);
 const air=structuredClone(s);air.positions[2]={fund:3,ticker:'AIR',name:'Airbus',quantity:3,currency:'EUR',exchange:'Euronext Paris',marketSymbol:'AIR.XPAR'};
 const old=structuredClone(q);old.prices['Euronext Paris:AIR']={symbol:'AIR',exchange:'XPAR',currency:'EUR',date:'2026-10-21',close:198.78};
 assert.equal(currentBookPoint(air,old,3),null,'An expired Airbus quote must not become a complete NAV');
 air.manualPrices=[{symbol:'AIR',exchange:'Euronext Paris',currency:'EUR',date:'2026-11-06',close:196.4,source:'Euronext dated source'}];
 const fixed=mergeManualPrices(air,old);assert.equal(fixed.prices['Euronext Paris:AIR'].close,196.4);assert.ok(currentBookPoint(air,fixed,3));assert.equal(fixed.fetchedAt,old.fetchedAt,'Manual import does not claim a new provider run');
 now='2026-11-10T06:00:00Z';const next=structuredClone(q);next.prices['Euronext Amsterdam:AAA']={...next.prices['Euronext Amsterdam:AAA'],date:'2026-11-09',close:105};next.history['Euronext Amsterdam:AAA'].push({date:'2026-11-09',close:105});next.benchmark.points.push({date:'2026-11-09',close:101});next.benchmark.latest=next.benchmark.points.at(-1);
 const p=currentBookPoint(s,next,1);assert.equal(p.nav,121);assert.equal(p.date,'2026-11-10');assert.equal(memberHistory(s.members[0],s,[],[],p).at(-1).value,484);
 assert.equal(currentFundHistory(s,next,1).at(-1).nav,121,'Daily continuation uses current unit pool, not old fund index units');
 let calls=0,credits=0;globalThis.fetch=async input=>{calls++;const url=new URL(input),symbol=url.searchParams.get('symbols');if(symbol==='AIR.XPAR')return Response.json({data:[{symbol,exchange:'XPAR',price_currency:'EUR',date:'2026-11-09T00:00:00Z',close:197}]});return Response.json({data:[{symbol:'GSPC.INDX',exchange:'INDX',date:'2026-11-09T00:00:00Z',close:6000}]});};
 const fetched=await fetchDailyQuotes([air.positions[2]],'fixture-only',fixed,async n=>credits+=n,new Date(now));
 assert.equal(fetched.prices['Euronext Paris:AIR'].close,197);assert.equal(calls,2);assert.equal(credits,2,'One stock and one index, no retry or backfill');
 console.log('Passed: unit-only source, 100% member allocation, absolute cash, payable neutrality, no old NAV override, missing/stale quote rejection, verified Airbus seed, exact provider symbol, current-day calculation and next daily continuation. Zero real provider calls.');
}finally{globalThis.Date=RealDate;globalThis.fetch=realFetch;}
