import assert from 'node:assert/strict';
import {canCompareFunds,comparisonCalendar,comparisonAxis} from '../lib/portal/fund-comparison.ts';
for(const role of ['Lid','Bestuurder','', 'Hoofdbestuurder-extra'])assert.equal(canCompareFunds({role,active:true}),false);
assert.equal(canCompareFunds({role:'Hoofdbestuurder',active:true}),true);
assert.equal(canCompareFunds({role:'Hoofdbestuurder',active:false}),false);
const h={1:[{date:'2026-09-16',nav:100,estimated:true},{date:'2026-09-17',nav:110}],2:[{date:'2026-09-16',nav:500},{date:'2026-09-17',nav:500}],3:[{date:'2026-09-17',nav:10}]};
const result=comparisonCalendar(h,'2026-09-18');assert.equal(result.days.length,3);assert.equal(result.days[0].fund1,0);assert.ok(Math.abs(result.days[1].fund1-.1)<1e-12);assert.equal(result.days[1].fund2,0);assert.equal(result.days[1].fund3,null);assert.equal(result.days[2].fund1,null);assert.equal(result.reconstructed,true);
// Doubling total assets and units leaves NAV unchanged: no deposit return.
const flow=comparisonCalendar({1:[{date:'2026-09-16',nav:1000/10},{date:'2026-09-17',nav:2000/20}],2:[],3:[]},'2026-09-17');assert.equal(flow.days[1].fund1,0);
const axis=comparisonAxis('2026-11-11');assert.equal(axis.ticks.length,10);assert.equal(new Date(axis.ticks.at(-1)).toISOString().slice(0,10),'2027-05-25');assert.ok(axis.end>Date.parse('2026-11-11'));assert.equal(comparisonCalendar(h,'2026-09-19').days.length,4);assert.equal(comparisonAxis('2027-07-01').end,Date.parse('2027-07-01'));
console.log('PASS: chief-only authorization, shared baseline and calendar, NAV returns excluding capital flows, missing-source gaps, reconstruction disclosure, reference date ticks, automatic extension.');
