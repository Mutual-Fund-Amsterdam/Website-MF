import {NextResponse} from 'next/server';
import {getMemberSession,getDailyQuotes} from '@/lib/portal/store';
import {currentBookPoint} from '@/lib/portal/book-valuation';
import {portfolioView} from '@/lib/portal/portfolio';
export const runtime='nodejs';
export const dynamic='force-dynamic';
/** Read-only reconciliation of the same valuation displayed to each member.
 * No codes, bank account numbers or API credentials are returned. */
export async function GET(){
 const headers={'Cache-Control':'private, no-store'};
 const session=await getMemberSession();
 if(!session)return NextResponse.json({error:'Log eerst in.'},{status:401,headers});
 if(session.member.role!=='Hoofdbestuurder')return NextResponse.json({error:'Alleen hoofdbestuur.'},{status:403,headers});
 const snapshot=session.snapshot,quotes=await getDailyQuotes();
 const funds=([1,2,3] as const).map(fund=>{
  const point=currentBookPoint(snapshot,quotes,fund),view=portfolioView(snapshot.positions.filter(p=>p.fund===fund),snapshot.cash.find(c=>c.fund===fund),quotes);
  return {fund,...point,stocks:view.stockValue,cash:view.cashValue,other:view.otherValue,payables:view.payablesValue,missing:view.missing};
 });
 const members=snapshot.members.map(m=>{
  const point=funds.find(f=>f.fund===m.fund),events=(snapshot.transactions??[]).filter(e=>e.memberId===m.id&&e.fund===m.fund);
  const units=events.length?Math.max(0,events.reduce((n,e)=>n+e.units,0)):null;
  return {id:m.id,name:m.name,fund:m.fund,active:m.active,units,participation:m.participation,date:point?.date??null,value:units!==null&&point?.nav!==undefined?units*point.nav:null};
 });
 return NextResponse.json({digest:snapshot.digest,unitLedger:snapshot.unitLedger,quotesAt:quotes?.fetchedAt,manualQuotesAt:quotes?.manualUpdatedAt,funds,members},{headers});
}
