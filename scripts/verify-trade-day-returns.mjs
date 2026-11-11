import assert from 'node:assert/strict';
import { estimatedFundHistory } from '../lib/portal/estimated-history.ts';
import { comparisonModes } from '../lib/portal/comparison.ts';
import { memberValuesAtNav } from '../lib/portal/member-history.ts';
const dates=['2026-09-16','2026-09-17','2026-09-18'];
const rows=values=>dates.map((date,i)=>({date,close:values[i]}));
const event=(kind,symbol,quantity,netEur,date)=>({fund:1,broker:'Saxo',kind,symbol,quantity,netEur,currency:'EUR',assetClass:'stock',exchange:'X',date});
const broker=[event('Ankerpositie','SOLD',10,0,dates[0]),event('Sell','SOLD',-10,109,dates[1]),event('Buy','NEW',5,-101,dates[1])];
const snapshot={positions:[{fund:1,ticker:'NEW',currency:'EUR',exchange:'X'}],transactions:[{fund:1,memberId:'m',date:dates[0],units:2,amount:200}],ledger:{broker,bank:[{fund:1,kind:'Bankopening',amountCents:90000,date:dates[0]},{fund:1,kind:'Banksluiting',amountCents:90000,date:dates[2]}]},fundHistory:[{fund:1,date:dates[0],totalUnits:10,nav:100},{fund:1,date:dates[2],totalUnits:10,nav:102.8}]};
const quotes={prices:{},benchmark:{points:rows([100,100,100])},eurUsdHistory:rows([1,1,1]),history:{'X:SOLD':rows([10,999,888]),'X:NEW':rows([500,22,24])}};
const series=estimatedFundHistory(snapshot,quotes,1);
assert.ok(Math.abs(series[1].nav-101.8)<1e-10,'Sale receipts, buy cost and both commissions must reconcile to closing assets');
assert.equal(memberValuesAtNav({id:'m',fund:1},snapshot,series)[1].value,2*series[1].nav);
console.log('Passed sale to zero, newly purchased stock, both execution prices and fees, and member valuation.');

// The archive includes redeemed investors. Today's partial register must not
// change how a historical execution gain is distributed over historical units.
const migrated={...snapshot,cash:[],unitLedger:{asOf:{1:'2026-11-09'}}};
const historical=estimatedFundHistory(migrated,quotes,1);
assert.ok(Math.abs(historical[1].nav-101.8)<1e-10);
assert.equal(historical[1].totalUnits,10);

const prior=[{...historical[0],date:'2026-09-14',estimated:false},{...historical[0],date:'2026-09-15',estimated:true}];
const historyQuotes={...quotes,benchmark:{points:[...prior.map(p=>({date:p.date,close:100})),...quotes.benchmark.points]},eurUsdHistory:[...prior.map(p=>({date:p.date,close:1})),...quotes.eurUsdHistory]};
const modes=comparisonModes([...prior,...historical],historyQuotes);
assert.deepEqual(modes.historical.points.map(p=>p.date),[prior[0].date,...dates]);
assert.deepEqual(modes.year.points.map(p=>p.date),dates);

// Two retirees left before the roster migration. Recover their units through
// the change in the archive without importing its stale closing unit balance.
const archiveDates=['2026-09-10','2026-09-11','2026-09-16','2026-10-06'];
const fixture={...migrated,transactions:[{fund:1,memberId:'m',date:archiveDates[0],amount:800,units:8}],
 fundHistory:[{fund:1,date:archiveDates[0],nav:100,totalUnits:9},{fund:1,date:archiveDates[1],nav:100,totalUnits:9},{fund:1,date:archiveDates[3],nav:105,totalUnits:7}],
 ledger:{...snapshot.ledger,broker:[event('Ankerpositie','SOLD',10,0,archiveDates[1]),event('Dividend','SOLD',null,1,archiveDates[2])]}};
const fixtureQuotes={...quotes,benchmark:{points:archiveDates.map(date=>({date,close:100}))},eurUsdHistory:archiveDates.map(date=>({date,close:1})),
 history:{'X:SOLD':archiveDates.map((date,i)=>({date,close:[10,10,12,13][i]}))}};
const navHistory=estimatedFundHistory(fixture,fixtureQuotes,1);
const open=navHistory.find(p=>p.date===archiveDates[2]);
assert.equal(open.totalUnits,10);
assert.equal(open.nav,(900+20+1)/10);
assert.equal(open.estimated,true);
const linked=comparisonModes(navHistory,fixtureQuotes).historical;
assert.equal(linked.points.find(p=>p.date===archiveDates[1]).fund,0);
assert.ok(linked.benchmarkHistory.some(p=>p.date===archiveDates[1]));

const oldNumber={id:'m',fund:2};
const migratedEvents=[[153,'2014-11-30',500,5],[220,'2015-11-18',-543.20,-5],[655,'2026-11-09',500,1]].map(([row,date,amount,units])=>({fund:2,memberId:'m',date,units,amount,source:`Admin Fonds 2 9 Nov 2026.xlsm / Transacties ${row}`}));
const reused=memberValuesAtNav(oldNumber,{transactions:migratedEvents,cash:[]},[{date:'2026-09-16',nav:500},{date:'2026-11-09',nav:501}]);
assert.deepEqual(reused.map(p=>[p.date,p.value,p.netInleg]),[['2026-11-09',501,500]]);

// A sourced meeting valuation already uses the reconciled pool. Do not apply
// the legacy unit adjustment to it again or silently replace it with the model.
const confirmed={...fixture,valuationReferences:[{fund:1,date:'2026-09-16',nav:95,totalUnits:10,source:'Checked statement'}]};
const confirmedHistory=estimatedFundHistory(confirmed,fixtureQuotes,1);
const confirmedStart=confirmedHistory.find(p=>p.date==='2026-09-16');
assert.equal(confirmedStart.nav,95);
assert.equal(confirmedStart.totalUnits,10);
assert.equal(confirmedStart.estimated,false);
assert.equal(comparisonModes(confirmedHistory,fixtureQuotes).year.points[0].fund,0);
assert.equal(memberValuesAtNav({id:'m',fund:1},confirmed,confirmedHistory).find(p=>p.date==='2026-09-16').value,8*95);
