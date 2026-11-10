import assert from 'node:assert/strict';
import {memberHistory} from '../lib/portal/member-history.ts';
import {cashReviewIssues} from '../lib/portal/cash-review.ts';
const s={cash:[{fund:2,basisNote:'IBKR: EUR-rapportwaarde per 2026-10-21',brokerAsOf:'2026-11-03'}],ledger:{broker:[{fund:2,broker:'IBKR',kind:'Brokersluiting',date:'2026-10-21'}],bank:[{fund:2,kind:'Brokertransfer',date:'2026-11-03',matchId:''}]}};
assert.equal(cashReviewIssues(s,2).length,1);
s.cash[0].brokerAsOf='2026-11-10';assert.equal(cashReviewIssues(s,2).length,1,'Later calculated dates cannot certify a cash closing');
s.ledger.bank[0].matchId='matched-broker-leg';assert.equal(cashReviewIssues(s,2).length,0);
s.ledger.bank[0].matchId='';s.cash[0].basisNote='IBKR: rechtstreeks ingevoerde absolute cashstanden';assert.equal(cashReviewIssues(s,2).length,0);
assert.equal(cashReviewIssues(s,1).length,0);assert.deepEqual(cashReviewIssues({},2),[]);
console.log('Passed: unconfirmed cash remainder rejected, rollforward does not certify, exact matching or a new absolute source resolves review, isolation and missing legacy metadata preserved.');

const member={id:'M1',fund:1},snap={members:[member],cash:[{fund:1}],unitLedger:{asOf:{1:'2026-11-09'}},ledger:{bank:[],broker:[]},fundHistory:[],transactions:[{fund:1,memberId:'M1',date:'2026-09-01',amount:500,units:5,nav:100,source:'fixture'}]};
const bad={fund:1,date:'2026-11-09',nav:300,fundValue:1500,coverage:'book'},good={fund:1,date:'2026-11-10',nav:100,fundValue:500,coverage:'book',cashConfirmed:true};
const h=memberHistory(member,snap,[bad,good]);assert.ok(!h.some(p=>p.date==='2026-11-09'),'Old unapproved saved book points must not reappear as checked history');assert.equal(h.at(-1).value,500);
