import assert from 'node:assert/strict';
import {fetchDailyQuotes,refreshWindow} from '../lib/portal/marketstack.ts';
import {compareFundReturns,meetingComparison} from '../lib/portal/comparison.ts';
import {createLocalStore} from '../lib/portal/local-store.ts';
const positions=[{fund:1,ticker:'AAA',name:'Fictief A',quantity:1,currency:'USD',exchange:'Nasdaq'},{fund:2,ticker:'AAA',name:'Fictief A',quantity:2,currency:'USD',exchange:'Nasdaq'},{fund:3,ticker:'BBB',name:'Fictief B',quantity:1,currency:'EUR',exchange:'Euronext Amsterdam'}];
const previous={fetchedAt:'2026-10-21T05:20:00Z',prices:{},history:{'Nasdaq:AAA':[{date:'2026-10-06',close:90}]},benchmark:{name:'S&P 500',points:[{date:'2026-10-06',close:100}],latest:{date:'2026-10-06',close:100}}};
const originalFetch=globalThis.fetch;const urls=[],charges=[];
try{
 globalThis.fetch=async input=>{
  const url=new URL(input);urls.push(url);
  const symbols=url.searchParams.get('symbols').split(',');
  const data=symbols.map(s=>s==='GSPC.INDX'?{symbol:s,exchange:'INDX',date:'2026-10-22T00:00:00Z',close:101}:{symbol:s,exchange:s==='AAA'?'XNAS':'XAMS',price_currency:s==='AAA'?'USD':'EUR',date:'2026-10-22T00:00:00Z',close:100});
  // A misleading full pagination count must never trigger a historical/pagination request.
  return Response.json({pagination:{total:100000},data});
 };
 const q=await fetchDailyQuotes(positions,'fixture-key',previous,async(n,h)=>{assert.equal(h,false);charges.push(n);return charges.reduce((s,v)=>s+v,0);},new Date('2026-10-23T05:15:00Z'));
 assert.equal(charges.reduce((s,v)=>s+v,0),3,'Two unique symbols plus one index, independent of fund/member count');
 assert.equal(urls.length,3);assert.ok(urls.slice(0,2).every(u=>u.pathname.endsWith('/latest')&&!u.searchParams.has('offset')&&!u.searchParams.has('date_from')));
 assert.equal(urls[2].searchParams.get('date_from'),'2026-09-16');
 assert.equal(q.history['Nasdaq:AAA'].length,2,'Existing history is retained');
 assert.equal(q.benchmark.points[0].date,'2026-10-06');
 assert.equal(q.prices['Nasdaq:AAA'].date,'2026-10-22');
 urls.length=0;charges.length=0;
 const successful=globalThis.fetch;
 globalThis.fetch=async input=>new URL(input).searchParams.get('symbols')==='BBB.XAMS'?new Response('',{status:422}):successful(input);
 const partial=await fetchDailyQuotes(positions,'fixture-key',q,async n=>{charges.push(n);return charges.reduce((a,b)=>a+b,0);},new Date('2026-10-23T05:20:00Z'));
 assert.equal(partial.prices['Nasdaq:AAA'].date,'2026-10-22','Successful quotes survive another venue failure');
 assert.equal(partial.prices['Euronext Amsterdam:BBB'].close,q.prices['Euronext Amsterdam:BBB'].close,'Failed venue keeps its previous actual quote');
 assert.ok(partial.refreshIssues.some(s=>s.includes('XAMS')&&s.includes('422')));assert.equal(charges.reduce((a,b)=>a+b,0),3,'No paid retry after a venue failure');
 globalThis.fetch=async()=>new Response('',{status:503});
 const failed=await fetchDailyQuotes(positions,'fixture-key',q,async()=>0,new Date('2026-10-24T05:20:00Z'));
 assert.deepEqual(failed.prices,q.prices);assert.equal(failed.fetchedAt,q.fetchedAt,'Total failure does not claim a new successful fetch time');assert.equal(failed.lastAttemptAt,'2026-10-24T05:20:00.000Z');
}finally{globalThis.fetch=originalFetch;}
for(const [time,ok] of [['05:14:59',false],['05:15:00',true],['06:14:59',true],['06:15:00',false],['17:15:00',false]])assert.equal(refreshWindow(new Date('2026-10-23T'+time+'Z')),ok);
const p=(date,nav,bm)=>({date,nav,value:nav*10,fundReturn:0,benchmarkReturn:bm});
const rows=compareFundReturns([p('2026-09-11',80,.1),p('2026-09-16',100,.2),p('2026-10-12',95,.32),p('2026-10-20',120,null)]);
assert.equal(rows.length,2);assert.equal(rows[0].fund,0);assert.equal(rows[0].benchmark,0);
assert.ok(Math.abs(rows[1].fund+.05)<1e-10);assert.ok(Math.abs(rows[1].benchmark-.1)<1e-10);
assert.equal(rows.at(-1).date,'2026-10-12','No extension beyond comparable observations');
assert.equal(compareFundReturns([p('2026-10-07',100,.2)]).length,0,'No invented baseline');
const opening=[p('2026-09-11',100,.1),p('2026-10-06',105,.2)];
const meeting=meetingComparison(opening,{prices:{},benchmark:{points:[{date:'2026-09-16',close:100},{date:'2026-10-06',close:110}]},eurUsdHistory:[{date:'2026-09-16',close:1},{date:'2026-10-06',close:1}]});
assert.equal(meeting.referenceDate,'2026-09-11','Original valuation date is retained and disclosed');
assert.equal(meeting.points[0].date,'2026-09-16');assert.equal(meeting.points[0].fund,0);assert.ok(Math.abs(meeting.points[1].fund-.05)<1e-10);assert.ok(Math.abs(meeting.points[1].benchmark-.1)<1e-10);
assert.equal(meeting.points.at(-1).date,'2026-10-06');
assert.equal(meetingComparison(opening,null).points[1].benchmark,null,'No invented September 16 index close');
const store=createLocalStore('isolated-test-secret-not-a-production-key');
const lock='isolated:test:daily-lock:'+Date.now();
try{assert.equal((await Promise.all(Array.from({length:80},()=>store.set(lock,'claimed',{nx:true,ex:60})))).filter(v=>v==='OK').length,1);}finally{await store.del(lock);}
console.log('Passed: one daily window, atomic 80-way lock, 1 credit/unique stock + index, no backfill/pagination, cached history retained, shared 0% baseline, negative returns and shared ending date. Zero real provider calls.');
