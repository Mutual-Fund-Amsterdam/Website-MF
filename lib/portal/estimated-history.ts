import type {DailyQuotes, FundNumber, PricePoint, Snapshot} from "./types";
import {bankControl, bankValue} from "./ledger.ts";
import {modelSplits,modelHoldingsAt,splitSafeReturn} from "./history-splits.ts";
import {currentFundHistory} from "./current-fund-history";
import {currentBookPoint} from "./book-valuation";
import {fundUnitsAt} from "./fund-units";
import {FUND_RETURN_BASELINE} from "./comparison";

export type EstimatedFundPoint = {date:string; nav:number; lowNav:number; highNav:number; flatNav?:number; marketNav?:number; estimated:boolean; priceCoverage:number;totalUnits?:number;fundValue?:number};
const DAY=86400000;
function latest(rows:PricePoint[]|undefined,date:string,maxAge=7){
 const p=rows?.filter(p=>p.date<=date).at(-1);
 return p&&Date.parse(date)-Date.parse(p.date)<=maxAge*DAY?p:undefined;
}
function fx(quotes:DailyQuotes,currency:string,date:string){
 return currency==="EUR"?1:latest(currency==="USD"?quotes.eurUsdHistory:quotes.fxHistory?.[currency],date)?.close;
}
function price(quotes:DailyQuotes,snapshot:Snapshot,symbol:string,currency:string){
 const instrument=quotes.historicalInstruments?.find(p=>p.ticker===symbol&&p.currency===currency)
  ??snapshot.positions.find(p=>p.ticker===symbol&&p.currency===currency);
 const exchange=instrument?.exchange??snapshot.ledger?.broker.find(e=>e.symbol===symbol&&e.currency===currency&&e.exchange)?.exchange;
 if(exchange && quotes.history?.[`${exchange}:${symbol.toUpperCase()}`])return quotes.history[`${exchange}:${symbol.toUpperCase()}`];
 const matches=Object.entries(quotes.history??{}).filter(([key])=>key.endsWith(':'+symbol.toUpperCase()));
 return !exchange && matches.length===1?matches[0][1]:undefined;
}
/** A model spread, not a confidence interval: unpriced exposure flat vs moving with S&P 500.
 * Both paths are reconciled to reported NAVs; only real dated prices drive daily variation.
 * Intermediate days remain indicative; reported NAV anchors and ledger events are preserved. */
export function estimatedFundHistory(snapshot:Snapshot,quotes:DailyQuotes|null,fund:FundNumber):EstimatedFundPoint[]{
 const extension=quotes?currentFundHistory(snapshot,quotes,fund):[];
 const book=currentBookPoint(snapshot,quotes,fund);if(book)extension.push(book);
 const modelDates=new Set(extension.map(p=>p.date));
 const anchors=[...new Map([...(snapshot.fundHistory??[]),...extension].filter(p=>p.fund===fund&&p.nav>0&&p.totalUnits>0).map(p=>[p.date,p])).values()].sort((a,b)=>a.date.localeCompare(b.date));
 if(!anchors.length)return [];
 const reported=anchors.map(p=>({date:p.date,nav:p.nav,lowNav:p.nav,highNav:p.nav,estimated:modelDates.has(p.date),priceCoverage:1}));
 if(!snapshot.ledger||!quotes||anchors.length===1)return reported;
 const bank=bankControl(snapshot.ledger,fund);
 const end=anchors.at(-1)!.date;
 const brokerStart=snapshot.ledger.broker.filter(e=>e.fund===fund&&["Brokeropening","Buy","Sell"].includes(e.kind)).map(e=>e.date).sort()[0];
 const from=[bank.from??end,brokerStart??anchors[0].date,anchors[0].date].sort().at(-1)!;
 const benchmark=quotes.benchmark?.points??[];
 const eurIndex=(date:string)=>{const p=latest(benchmark,date,4),r=fx(quotes,"USD",date);return p&&r?p.close/r:null;};
 const broker=snapshot.ledger.broker.filter(e=>e.fund===fund&&e.quantity&&["Buy","Sell","Ankerpositie"].includes(e.kind));
 const cashEvents=snapshot.ledger.broker.filter(e=>e.fund===fund&&e.processing!=="Negeren"&&
  ["Buy","Sell","Dividend","Foreign Tax Withholding","Credit Interest"].includes(e.kind));
 const splits=modelSplits(snapshot,quotes);
 const allDates=new Set<string>(anchors.filter(p=>p.date>=from).map(p=>p.date));
 allDates.add(from);
 for(const e of cashEvents)if(e.date>=from&&e.date<=end)allDates.add(e.date);
 for(const p of benchmark)if(p.date>=from&&p.date<=end)allDates.add(p.date);
 for(const rows of Object.values(quotes.history??{}))for(const p of rows)if(p.date>=from&&p.date<=end)allDates.add(p.date);
 // The fixed meeting reference can be inside a reporting interval.
 if(from<="2026-09-16"&&end>="2026-09-16")allDates.add("2026-09-16");
 const calendarFrom=[from,FUND_RETURN_BASELINE].sort().at(-1)!;
 for(let d=Date.parse(calendarFrom);d<=Date.parse(end);d+=DAY)allDates.add(new Date(d).toISOString().slice(0,10));
 const sessions=new Set([...(quotes.benchmark?.points??[]).map(p=>p.date),...Object.values(quotes.history??{}).flatMap(rows=>rows.map(p=>p.date)),...(snapshot.transactions??[]).filter(e=>e.fund===fund).map(e=>e.date),...(snapshot.cash??[]).filter(c=>c.fund===fund).flatMap(c=>[c.ingAsOf,c.brokerAsOf,c.otherAsOf,c.payablesAsOf]).filter((d):d is string=>!!d)]);
 const dates=[...allDates].sort();
 const output=new Map<string,EstimatedFundPoint>(reported.map(p=>[p.date,p]));
 for(let i=0;i<anchors.length-1;i++){
  const left=anchors[i],right=anchors[i+1];if(right.date<from)continue;
  const interval=[left.date,...dates.filter(d=>d>left.date&&d<=right.date)];
  if(interval.at(-1)!==right.date)interval.push(right.date);
  let incompleteInterval=false;
  let flat=1,market=1;const path=[{date:left.date,flat,market,coverage:1}];
  for(let j=1;j<interval.length;j++){
   const old=interval[j-1],date=interval[j],t=(Date.parse(old)-Date.parse(left.date))/(Date.parse(right.date)-Date.parse(left.date));
   const approximateAssets=left.nav*left.totalUnits*(1-t)+right.nav*right.totalUnits*t;
   const cash=Math.max(0,bankValue(snapshot.ledger,fund,old)??0);
   const holdings=modelHoldingsAt(snapshot,fund,old,splits);
   const booked=cashEvents.filter(e=>e.date===date);
   const trades=booked.filter(e=>e.kind==="Buy"||e.kind==="Sell");
   const traded=new Set(trades.map(e=>e.symbol));
   let knownValue=0,unknownValue=0,pnl=0;
   let tradePnl=0;
   let incomplete=false;
   if(trades.length){
    const closing=modelHoldingsAt(snapshot,fund,date,splits);
    for(const symbol of traded){
     const fills=trades.filter(e=>e.symbol===symbol);
     const currency=fills[0].currency;
     const rows=price(quotes,snapshot,symbol,currency);
     const quantityBefore=holdings.get(symbol)?.quantity??0,quantityAfter=closing.get(symbol)?.quantity??0;
     const before=latest(rows,old),after=latest(rows,date);
     const rateBefore=fx(quotes,currency,old),rateAfter=fx(quotes,currency,date);
     if((quantityBefore&&(!before||!rateBefore))||(quantityAfter&&(!after||!rateAfter))){incomplete=true;continue;}
     const opening=quantityBefore?(quantityBefore*before!.close/rateBefore!):0;
     const ending=quantityAfter?(quantityAfter*after!.close/rateAfter!):0;
     knownValue+=opening;
     tradePnl+=ending-opening;
     for(const fill of fills){
      const rate=fx(quotes,fill.cashCurrency||currency,date);
      const amount=fill.netEur??(fill.cashDelta!=null&&rate?fill.cashDelta/rate:null);
      if(amount==null){incomplete=true;continue;}
      tradePnl+=amount;
     }
    }
   }
   for(const e of booked)if(e.kind!=="Buy"&&e.kind!=="Sell"){
    if(e.netEur==null)incomplete=true;else tradePnl+=e.netEur;
   }
   for(const h of holdings.values()){
    if(h.quantity<=0||traded.has(h.symbol))continue;
    const rows=price(quotes,snapshot,h.symbol,h.currency),before=latest(rows,old),after=latest(rows,date);
    const rateBefore=fx(quotes,h.currency,old),rateAfter=fx(quotes,h.currency,date);
    const reference=broker.filter(e=>e.symbol===h.symbol&&e.grossEur!==null&&e.quantity).sort((a,b)=>Math.abs(Date.parse(a.date)-Date.parse(old))-Math.abs(Date.parse(b.date)-Date.parse(old)))[0];
    const cost=reference?Math.abs(reference.grossEur!/reference.quantity!)*h.quantity:0;
    const exposure=before&&rateBefore?h.quantity*before.close/rateBefore:cost;
    if(!["stock","STK"].includes(h.assetClass)||!before||!after||!rateBefore||!rateAfter||after.date<=before.date){unknownValue+=exposure;continue;}
    // Cash distributions enter separately. Use raw closes on a common split basis.
    const factor=splits.filter(s=>s.symbol===h.symbol&&s.date>before.date&&s.date<=after.date).reduce((f,s)=>f*s.factor,1);
    const rawRatio=after.close/before.close;
    // A feed can alternate old/new price bases around a disclosed split. An
    // unmatched discontinuity is missing data, not a sudden investment gain/loss.
    if(factor===1&&(rawRatio>1.8||rawRatio<1/1.8)&&splits.some(s=>s.symbol===h.symbol&&Math.abs(Date.parse(after.date)-Date.parse(s.date))<=7*DAY)){
     unknownValue+=cost||exposure;continue;
    }
    const ratio=splitSafeReturn({close:before.close},{close:after.close},factor)*rateBefore/rateAfter;
    if(!Number.isFinite(ratio)||ratio<=0){unknownValue+=exposure;continue;}
    knownValue+=exposure;pnl+=exposure*(ratio-1);
   }
   incompleteInterval ||= incomplete;
   const investable=Math.max(0,approximateAssets-cash);
   const scale=knownValue+unknownValue>investable&&knownValue+unknownValue>0?investable/(knownValue+unknownValue):1;
   const known=Math.min(investable,knownValue*scale);
   // Only evidenced holdings get a market scenario. An unexplained residual is not
   // silently invested in the index (which would turn incoming deposits into returns).
   const unknown=Math.min(Math.max(0,investable-known),unknownValue*scale);
   const bm0=eurIndex(old),bm1=eurIndex(date),bmReturn=bm0&&bm1?bm1/bm0-1:0;
   const units=fundUnitsAt(snapshot,fund,old);
   if(!units){incompleteInterval=true;break;}
   const assetsBefore=left.nav*flat*units;
   if(assetsBefore<=0){incompleteInterval=true;break;}
   const r=(pnl+tradePnl)/assetsBefore;
   flat*=Math.max(.000001,1+r);
   market*=Math.max(.000001,1+r+(approximateAssets>0?unknown/approximateAssets*bmReturn:0));
   path.push({date,flat,market,coverage:incomplete?0:investable>0?known/investable:1});
  }
  if(incompleteInterval)continue;
  const target=right.nav/left.nav;
  const activeDays=interval.slice(1).filter(d=>sessions.has(d));
  for(const p of path){
   if(p.date<from)continue;
   const t=activeDays.length?activeDays.filter(d=>d<=p.date).length/activeDays.length:p.date===right.date?1:0;
   const a=left.nav*p.flat*Math.pow(target/flat,t),b=left.nav*p.market*Math.pow(target/market,t);
   const isAnchor=p.date===left.date||p.date===right.date;
   const nav=isAnchor?(p.date===left.date?left.nav:right.nav):a;
   output.set(p.date,{date:p.date,nav,lowNav:isAnchor?nav:Math.min(a,b),highNav:isAnchor?nav:Math.max(a,b),flatNav:isAnchor?nav:a,marketNav:isAnchor?nav:b,estimated:!isAnchor||modelDates.has(p.date),priceCoverage:Math.max(0,Math.min(1,p.coverage))});
  }
 }
 return [...output.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(p=>{const units=fundUnitsAt(snapshot,fund,p.date);return {...p,...(units?{totalUnits:units,fundValue:units*p.nav}:{})};});
}
