import assert from 'node:assert/strict';
import {memberCalendar} from '../lib/portal/member-calendar.ts';
const points=[{date:'2026-09-16',value:500,netInleg:500,indicative:true},{date:'2026-11-09',value:520,netInleg:500},{date:'2026-11-11',value:522,netInleg:500}];
const out=memberCalendar(points,'2026-11-11');assert.equal(out.length,57);assert.equal(out[0].date,'2026-09-16');assert.equal(out[0].checkedValue,null);assert.equal(out[0].netInleg,500);assert.equal(out.at(-1).checkedValue,522);assert.equal(out.at(-2).checkedValue,null);
const tomorrow=memberCalendar(points,'2026-11-12');assert.equal(tomorrow.length,58);assert.equal(tomorrow.at(-1).checkedValue,null);assert.equal(tomorrow.at(-1).netInleg,500);assert.ok(memberCalendar([],'2026-11-11').every(p=>p.checkedValue===null&&p.netInleg===null));
console.log('PASS: complete calendar, next day extension, no fabricated values, no interpolation through missing days, cash flow distinct from value.');
