import assert from 'node:assert/strict';
import {memberHistory} from '../lib/portal/member-history.ts';
const member={id:'test',fund:1};
const snapshot={ledger:{},transactions:[
 {fund:1,memberId:'test',date:'2026-09-16',amount:600,units:6,nav:100},
 {fund:1,memberId:'test',date:'2026-10-10',amount:-200,units:-2,nav:100}
],fundHistory:[{fund:1,date:'2026-10-06',nav:110}]};
const history=memberHistory(member,snapshot,[
 {fund:1,date:'2026-10-15',nav:90,coverage:'indicative'},
 {fund:1,date:'2026-10-12',nav:105,coverage:'verified'}
]);
assert.deepEqual(history.at(-1),{date:'2026-10-12',value:420,netInleg:400});
assert.equal(history.at(-1).value-history.at(-1).netInleg,20);
const earlier=memberHistory(member,{...snapshot,transactions:snapshot.transactions.slice(0,1)},[]).at(-1);
assert.deepEqual(earlier,{date:'2026-10-06',value:660,netInleg:600});
assert.deepEqual(memberHistory({...member,fund:2},snapshot,[]),[]);
console.log('Passed: latest dated member valuation, partial withdrawal, same-date result, unverified exclusion and fund isolation.');
