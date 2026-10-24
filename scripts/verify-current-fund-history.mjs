import assert from 'node:assert/strict';
import {currentFundHistory} from '../lib/portal/current-fund-history.ts';
import {estimatedFundHistory} from '../lib/portal/estimated-history.ts';
import {comparisonModes} from '../lib/portal/comparison.ts';
const dates=['2026-09-14','2026-09-15','2026-09-16','2026-09-17','2026-09-18'];
const prices=[50,55,48,56,60],points=dates.map((date,i)=>({date,close:prices[i]}));
const position={fund:1,ticker:'AAA',name:'Test',quantity:10,currency:'EUR',exchange:'Euronext Amsterdam',isin:'',tradingViewSymbol:''};
const snapshot={input:{version:3,cutoff:'2026-09-16',events:{}},positions:[position],transactions:[],cash:[{fund:1,ingEur:500,brokerEur:0,brokerUsd:0,brokerCad:0,otherEur:0}],fundHistory:[{fund:1,date:dates[0],nav:100,totalUnits:10}]};
const quotes={prices:{'Euronext Amsterdam:AAA':{...points.at(-1),symbol:'AAA',currency:'EUR',exchange:'XAMS'}},history:{'Euronext Amsterdam:AAA':points},benchmark:{points:dates.map(date=>({date,close:100})),latest:{date:dates.at(-1),close:100}},eurUsdHistory:dates.map(date=>({date,close:1}))};
const oldFetch=globalThis.fetch;globalThis.fetch=()=>{throw Error('Valuation must use stored data only');};
try{
 const live=currentFundHistory(snapshot,quotes,1);assert.equal(live[0].date,'2026-09-16');assert.equal(live[0].nav,98);assert.equal(live.at(-1).nav,110);
 const extended=estimatedFundHistory(snapshot,quotes,1);assert.equal(extended.at(-1).date,'2026-09-18');assert.ok(extended.at(-1).estimated,'Book valuation is not an approved admin measurement');
 const modes=comparisonModes(extended,quotes,'2026-09-16');assert.equal(modes.year.points[0].fund,0);assert.equal(modes.year.points[0].benchmark,0);
 const changed=structuredClone(snapshot);changed.positions[0].quantity=12;changed.cash[0].ingEur=488;
 changed.transactions=[{fund:1,date:'2026-09-17',amount:100,units:100/106,source:'Invoer:deposit'}];
 changed.ledger={broker:[{fund:1,date:'2026-09-17',source:'Invoer',kind:'Buy',symbol:'AAA',quantity:2,currency:'EUR',nativeCash:-112,cashDelta:-112,cashCurrency:'EUR',exchange:'Euronext Amsterdam'}]};
 const moved=currentFundHistory(changed,quotes,1);assert.equal(moved[0].nav,98,'Later purchase and deposit are reversed before their date');assert.ok(Math.abs(moved[1].nav-106)<1e-9,'Deposit and purchase do not create returns');assert.ok(moved.at(-1).nav>moved[1].nav);
 const tomorrow=structuredClone(quotes);tomorrow.benchmark.points.push({date:'2026-09-21',close:101});tomorrow.benchmark.latest={date:'2026-09-21',close:101};assert.equal(currentFundHistory(snapshot,tomorrow,1).at(-1).date,'2026-09-18','Never extend beyond the common stock close');
 const missing=structuredClone(quotes);missing.history={};missing.prices={};assert.deepEqual(currentFundHistory(snapshot,missing,1),[],'Missing prices do not become zero');
 const daily=structuredClone(quotes);daily.history['Euronext Amsterdam:AAA'].push({date:'2026-09-21',close:59});daily.prices['Euronext Amsterdam:AAA']={...daily.prices['Euronext Amsterdam:AAA'],date:'2026-09-21',close:59};daily.benchmark=tomorrow.benchmark;daily.eurUsdHistory.push({date:'2026-09-21',close:1});
 const next=currentFundHistory(snapshot,daily,1);assert.equal(next.at(-1).date,'2026-09-21');assert.equal(next.at(-1).nav,109);assert.deepEqual(next.slice(0,live.length),live,'New daily data preserves prior book valuations');
 assert.deepEqual(currentFundHistory(snapshot,quotes,2),[],'Fund isolation');
 console.log('Stored-book extension: daily market moves, fixed baseline, deposit neutrality, reversal of dated trades, missing prices, no future closes, stable prior daily values and no network calls.');
}finally{globalThis.fetch=oldFetch;}
