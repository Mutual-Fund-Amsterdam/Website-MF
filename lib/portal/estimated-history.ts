import type {DailyQuotes, FundNumber, PricePoint, Snapshot} from "./types";
import {bankControl, bankValue, holdingsAt} from "./ledger.ts";

export type EstimatedFundPoint = {date:string; nav:number; lowNav:number; highNav:number; flatNav?:number; marketNav?:number; estimated:boolean; priceCoverage:number};
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
 return instrument?quotes.history?.[`${instrument.exchange}:${instrument.ticker.toUpperCase()}`]:undefined;
}
/** A model spread, not a confidence interval: unpriced exposure flat vs moving with S&P 500.
 * Both paths are reconciled to reported NAVs; only real dated prices drive daily variation.
 * This separate series never changes member balances or verified risk statistics. */
export function estimatedFundHistory(snapshot:Snapshot,quotes:DailyQuotes|null,fund:FundNumber):EstimatedFundPoint[]{
 const anchors=(snapshot.fundHistory??[]).filter(p=>p.fund===fund&&p.nav>0&&p.totalUnits>0).sort((a,b)=>a.date.localeCompare(b.date));
 if(!anchors.length)return [];
 const reported=anchors.map(p=>({date:p.date,nav:p.nav,lowNav:p.nav,highNav:p.nav,estimated:false,priceCoverage:1}));
 if(!snapshot.ledger||!quotes)return reported;
 const bank=bankControl(snapshot.ledger,fund);
 const end=anchors.at(-1)!.date;
 const twoYears=new Date(end+"T12:00:00Z");twoYears.setUTCFullYear(twoYears.getUTCFullYear()-2);
 const from=[bank.from??end,twoYears.toISOString().slice(0,10),anchors[0].date].sort().at(-1)!;
 const benchmark=quotes.benchmark?.points??[];
 const eurIndex=(date:string)=>{const p=latest(benchmark,date,4),r=fx(quotes,"USD",date);return p&&r?p.close/r:null;};
 const broker=snapshot.ledger.broker.filter(e=>e.fund===fund&&e.quantity&&["Buy","Sell","Ankerpositie"].includes(e.kind));
 const allDates=new Set<string>(anchors.filter(p=>p.date>=from).map(p=>p.date));
 for(const p of benchmark)if(p.date>=from&&p.date<=end)allDates.add(p.date);
 for(const rows of Object.values(quotes.history??{}))for(const p of rows)if(p.date>=from&&p.date<=end)allDates.add(p.date);
 // The fixed meeting reference can be inside a reporting interval.
 if(from<="2026-09-16"&&end>="2026-09-16")allDates.add("2026-09-16");
 const dates=[...allDates].sort();
 const output=new Map<string,EstimatedFundPoint>(reported.filter(p=>p.date<from).map(p=>[p.date,p]));
 for(let i=0;i<anchors.length-1;i++){
  const left=anchors[i],right=anchors[i+1];if(right.date<from)continue;
  const interval=[left.date,...dates.filter(d=>d>left.date&&d<=right.date)];
  if(interval.at(-1)!==right.date)interval.push(right.date);
  let flat=1,market=1;const path=[{date:left.date,flat,market,coverage:1}];
  for(let j=1;j<interval.length;j++){
   const old=interval[j-1],date=interval[j],t=(Date.parse(old)-Date.parse(left.date))/(Date.parse(right.date)-Date.parse(left.date));
   const approximateAssets=left.nav*left.totalUnits*(1-t)+right.nav*right.totalUnits*t;
   const cash=Math.max(0,bankValue(snapshot.ledger,fund,old)??0);
   const holdings=holdingsAt(snapshot.ledger,fund,old).holdings;
   let knownValue=0,unknownValue=0,pnl=0;
   for(const h of holdings.values()){
    if(h.quantity<=0)continue;
    const rows=price(quotes,snapshot,h.symbol,h.currency),before=latest(rows,old),after=latest(rows,date);
    const rateBefore=fx(quotes,h.currency,old),rateAfter=fx(quotes,h.currency,date);
    const reference=broker.filter(e=>e.symbol===h.symbol&&e.grossEur!==null&&e.quantity).sort((a,b)=>Math.abs(Date.parse(a.date)-Date.parse(old))-Math.abs(Date.parse(b.date)-Date.parse(old)))[0];
    const cost=reference?Math.abs(reference.grossEur!/reference.quantity!)*h.quantity:0;
    const exposure=before&&rateBefore?h.quantity*before.close/rateBefore:cost;
    if(h.assetClass!=="stock"||!before||!after||!rateBefore||!rateAfter||after.date<=before.date){unknownValue+=exposure;continue;}
    // Adjusted closes supply a total-return move without a false split/dividend jump.
    const ratio=(after.adjustedClose??after.close)/(before.adjustedClose??before.close)*rateBefore/rateAfter;
    if(!Number.isFinite(ratio)||ratio<=0){unknownValue+=exposure;continue;}
    knownValue+=exposure;pnl+=exposure*(ratio-1);
   }
   const investable=Math.max(0,approximateAssets-cash);
   const scale=knownValue+unknownValue>investable&&knownValue+unknownValue>0?investable/(knownValue+unknownValue):1;
   const known=Math.min(investable,knownValue*scale);
   // Only evidenced holdings get a market scenario. An unexplained residual is not
   // silently invested in the index (which would turn incoming deposits into returns).
   const unknown=Math.min(Math.max(0,investable-known),unknownValue*scale);
   const bm0=eurIndex(old),bm1=eurIndex(date),bmReturn=bm0&&bm1?bm1/bm0-1:0;
   const r=approximateAssets>0?pnl*scale/approximateAssets:0;
   flat*=Math.max(.000001,1+r);
   market*=Math.max(.000001,1+r+(approximateAssets>0?unknown/approximateAssets*bmReturn:0));
   path.push({date,flat,market,coverage:investable>0?known/investable:1});
  }
  const target=right.nav/left.nav;
  for(const p of path){
   if(p.date<from)continue;
   const t=(Date.parse(p.date)-Date.parse(left.date))/(Date.parse(right.date)-Date.parse(left.date));
   const a=left.nav*p.flat*Math.pow(target/flat,t),b=left.nav*p.market*Math.pow(target/market,t);
   const isAnchor=p.date===left.date||p.date===right.date;
   const nav=isAnchor?(p.date===left.date?left.nav:right.nav):Math.sqrt(a*b);
   output.set(p.date,{date:p.date,nav,lowNav:isAnchor?nav:Math.min(a,b),highNav:isAnchor?nav:Math.max(a,b),flatNav:isAnchor?nav:a,marketNav:isAnchor?nav:b,estimated:!isAnchor,priceCoverage:Math.max(0,Math.min(1,p.coverage))});
  }
 }
 return [...output.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
