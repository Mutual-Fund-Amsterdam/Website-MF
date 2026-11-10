import type {Snapshot,DailyQuotes,FundNumber} from './types';
import {cashReviewIssues} from './cash-review';
import {portfolioView} from './portfolio';
import {currentBookPoint} from './book-valuation';
export type ReviewPrice={date:string;close:number};
export type ReviewFx={date:string;perEuro:number};
/** Assets and actual cash determine value. Administration imports supply units only. */
export function valuationReview(snapshot:Snapshot,prices:Record<string,ReviewPrice>,fx:Record<string,ReviewFx>){
 const enriched:DailyQuotes['prices']={};
 for(const p of snapshot.positions){const key=p.exchange+':'+p.ticker.toUpperCase();if(prices[key])enriched[key]={...prices[key],currency:p.currency,symbol:p.ticker,exchange:p.exchange};}
 const quotes={fetchedAt:'',prices:enriched,fx} as DailyQuotes;
 const quoteAsOf=Object.values(prices).map(p=>p.date).sort().at(-1)??null;
 const funds=[],members=[],positions=[];
 for(const fund of [1,2,3] as FundNumber[]){
  const cash=snapshot.cash.find(c=>c.fund===fund),view=portfolioView(snapshot.positions.filter(p=>p.fund===fund),cash,quotes);
  const point=currentBookPoint(snapshot,quotes,fund),asOf=point?.date??quoteAsOf;
  const total=view.fundValue,units=snapshot.totalUnitsByFund?.[fund]??null,nav=total!==null&&units&&units>0?total/units:null;
  const issues=cashReviewIssues(snapshot,fund),cashConfirmed=issues.length===0;let assigned=0,memberValue=0;
  for(const p of view.valued){
   const rate=p.position.currency==='EUR'?1:fx[p.position.currency]?.perEuro;
   positions.push({fund,ticker:p.position.ticker,name:p.position.name,quantity:p.position.quantity,currency:p.position.currency,price:p.quote?.close??null,date:p.quote?.date??null,fx:rate??null,value:p.valueEur});
   if(p.valueEur===null)issues.push(p.position.ticker+': koers of valuta ontbreekt of is ouder dan acht dagen');
   else if(p.quote!.date!==quoteAsOf)issues.push(p.position.ticker+': afwijkende koersdatum '+p.quote!.date);
  }
  for(const m of snapshot.members.filter(m=>m.fund===fund)){
   const events=(snapshot.transactions??[]).filter(e=>e.fund===fund&&e.memberId===m.id);
   const own=events.length?Math.max(0,events.reduce((n,e)=>n+e.units,0)):null,value=own!==null&&nav!==null?own*nav:null;
   assigned+=own??0;memberValue+=value??0;
   members.push({fund,id:m.id,name:m.name,active:m.active,units:own,nav,value,netDeposits:events.length?events.reduce((n,e)=>n+e.amount,0):null,asOf,status:!cashConfirmed?'Actuele brokercash niet aangesloten':own===null?'Nog geen ledeninleg geboekt':total===null?'Koers of valuta ontbreekt':'Deelbewijzen aangesloten; actuele bezittingen'});
  }
  const residualUnits=units===null?null:units-assigned,residualValue=residualUnits!==null&&nav!==null?residualUnits*nav:null;
  if(residualUnits!==null&&Math.abs(residualUnits)>1e-6)issues.push('Deelbewijzen van de huidige leden sluiten niet aan');
  if(view.payablesValue)issues.push(`Nog uit te betalen EUR ${view.payablesValue.toFixed(2)}; opgenomen in overige netto. Cash blijft het werkelijke rekeningbedrag.`);
  funds.push({fund,asOf,quoteAsOf,cashConfirmed,stocks:view.stockValue,cash:view.cashValue,other:view.otherValue-view.payablesValue,participations:view.otherValue,payables:view.payablesValue,total,quoteTotal:total,units,nav,assignedUnits:assigned,residualUnits,residualValue,memberValue,check:total!==null&&residualValue!==null?memberValue+residualValue-total:null,issues,status:total===null?'Onvolledig':'Actuele bezittingen en deelbewijzen'});
 }
 const asOf=funds.map(f=>f.asOf).filter((d):d is string=>!!d).sort().at(-1)??null;
 return {asOf,quoteAsOf,funds,members,positions};
}
