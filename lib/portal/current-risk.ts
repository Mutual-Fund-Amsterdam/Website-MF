import type {DailyQuotes,FundNumber,PricePoint,RiskMetrics,Snapshot} from "./types";
import {quoteKey} from "./marketstack";
import {portfolioView} from "./portfolio";
import {modelSplits,splitSafeReturn} from "./history-splits";
import {prior} from "./performance";

export type DetailedRisk=RiskMetrics&{from:string|null;observations:number;coverage:number;reason:string|null};
export const emptyRisk=(reason:string|null=null):DetailedRisk=>({asOf:null,from:null,observations:0,coverage:0,reason,sharpe:null,beta:null,volatility:null,maxDrawdown:null});
const day=86400000;
export function overnightReturn(series:PricePoint[],from:string,to:string):number|null{
 let factor=1;
 for(let t=Date.parse(from);t<Date.parse(to);t+=day){const date=new Date(t).toISOString().slice(0,10),rate=prior(series,date);if(!rate||Date.parse(date)-Date.parse(rate.date)>8*day)return null;factor*=1+rate.close/100/360;}
 return factor-1;
}
export function returnRisk(rows:{date:string;value:number;benchmark:number}[],estr:PricePoint[],coverage=1):DetailedRisk{
 const result={...emptyRisk(),from:rows[0]?.date??null,asOf:rows.at(-1)?.date??null,observations:Math.max(0,rows.length-1),coverage};
 if(rows.length<201||Date.parse(rows.at(-1)!.date)-Date.parse(rows[0].date)<330*day)return {...result,reason:"Onvoldoende gezamenlijke daggegevens voor 12 maanden."};
 if(rows.some(p=>!Number.isFinite(p.value)||p.value<=0||!Number.isFinite(p.benchmark)||p.benchmark<=0))return {...result,reason:"De gezamenlijke dagreeks is onvolledig."};
 const steps=rows.slice(1).map((p,i)=>({p,previous:rows[i]})).filter(({p,previous})=>Date.parse(p.date)-Date.parse(previous.date)<=4*day);
 result.observations=steps.length;
 if(steps.length<200)return {...result,reason:"Onvoldoende gezamenlijke dagrendementen voor 12 maanden."};
 const r=steps.map(({p,previous})=>p.value/previous.value-1),b=steps.map(({p,previous})=>p.benchmark/previous.benchmark-1);
 const mean=(a:number[])=>a.reduce((s,x)=>s+x,0)/a.length,variance=(a:number[])=>a.reduce((s,x)=>s+(x-mean(a))**2,0)/(a.length-1);
 const rf=steps.map(({p,previous})=>overnightReturn(estr,previous.date,p.date)),excess=rf.every(x=>x!==null)?r.map((x,i)=>x-rf[i]!):[];
 const vol=Math.sqrt(variance(r)*252),ev=excess.length?Math.sqrt(variance(excess)*252):0,bv=variance(b);
 let peak=rows[0].value,drawdown=0;for(const p of rows){peak=Math.max(peak,p.value);drawdown=Math.min(drawdown,p.value/peak-1);}
 return {...result,volatility:vol,sharpe:ev>0?mean(excess)*252/ev:null,beta:bv>1e-20?r.reduce((s,x,i)=>s+(x-mean(r))*(b[i]-mean(b)),0)/(r.length-1)/bv:null,maxDrawdown:drawdown,reason:rf.some(x=>x===null)?"Historische €STR ontbreekt; Sharpe niet beschikbaar.":null};
}
export function historicalDailyRisk(history:{date:string;nav:number}[],quotes:DailyQuotes|null):DetailedRisk{
 const end=history.at(-1)?.date;if(!end||!quotes)return emptyRisk("Fondsverloop ontbreekt.");
 const cutoff=new Date(Date.parse(end)-365*day).toISOString().slice(0,10),navs=new Map(history.map(p=>[p.date,p.nav]));
 const expected=(quotes.benchmark?.points??[]).filter(p=>p.date>=cutoff&&p.date<=end);
 const rows=expected.map(p=>{const fx=datedFx(quotes,"USD",p.date);return {date:p.date,value:navs.get(p.date)??NaN,benchmark:fx?p.close/fx:NaN};});
 const valid=rows.filter(p=>Number.isFinite(p.value)&&p.value>0&&Number.isFinite(p.benchmark)&&p.benchmark>0);
 return returnRisk(valid,quotes.estrHistory??[],rows.length?valid.length/rows.length:0);
}
function datedFx(quotes:DailyQuotes,currency:string,date:string):number|null{
 if(currency==="EUR")return 1;
 const rate=prior(currency==="USD"?quotes.eurUsdHistory??quotes.fxHistory?.USD??[]:quotes.fxHistory?.[currency]??[],date);
 return rate&&rate.close>0&&Date.parse(date)-Date.parse(rate.date)<=8*day?rate.close:null;
}
/** Hypothetical daily rebalancing to today's weights, never a realised fund history. */
export function currentPortfolioRisk(snapshot:Snapshot,quotes:DailyQuotes|null,fund:FundNumber):DetailedRisk{
 if(!quotes)return emptyRisk("Koersen ontbreken.");
 const positions=snapshot.positions.filter(p=>p.fund===fund),cash=snapshot.cash.find(c=>c.fund===fund),view=portfolioView(positions,cash,quotes);
 if(!view.fundValue||view.fundValue<=0||!cash)return emptyRisk("Fondswaarde of cash is onvolledig.");
 const end=positions.length?view.valued.map(v=>v.quote!.date).sort()[0]:quotes.benchmark?.latest?.date;
 if(!end)return emptyRisk("Koersdatum ontbreekt.");
 const cutoff=new Date(Date.parse(end)-365*day).toISOString().slice(0,10);
 const dates=(quotes.benchmark?.points??[]).filter(p=>p.date>=cutoff&&p.date<=end);
 const splits=modelSplits(snapshot,quotes);
 const components=view.valued.map(v=>({position:v.position,weight:v.valueEur!/view.fundValue!,points:new Map((quotes.history?.[quoteKey(v.position)]??[]).map(p=>[p.date,p]))}));
 const enough=(rows:PricePoint[])=>rows.length>=201&&Date.parse(rows.at(-1)!.date)-Date.parse(rows[0].date)>=330*day;
 const covered=components.filter(c=>enough([...c.points.values()].filter(p=>p.date>=cutoff&&p.date<=end&&datedFx(quotes,c.position.currency,p.date)!==null))).reduce((s,c)=>s+c.weight,0);
 const cashAmounts:Record<string,number>={EUR:cash.ingEur!+cash.brokerEur!,USD:cash.brokerUsd??0,CAD:cash.brokerCad??0};
 for(const [currency,balance] of Object.entries(cash.extraBalances??{}))cashAmounts[currency]=(cashAmounts[currency]??0)+balance.amount;
 const cashComponents=Object.entries(cashAmounts).filter(([,amount])=>amount!==0).map(([currency,amount])=>({currency,weight:amount/(currency==="EUR"?1:quotes.fx?.[currency]?.perEuro??NaN)/view.fundValue!}));
 const coverage=Math.max(0,Math.min(1,covered+cashComponents.filter(c=>dates.length>0&&dates.every(d=>datedFx(quotes,c.currency,d.date)!==null)).reduce((s,c)=>s+c.weight,0)));
 const base={...emptyRisk(),asOf:end,from:dates[0]?.date??null,coverage,observations:Math.max(0,dates.length-1)};
 if((cash.otherEur??0)!==0)return {...base,reason:"Voor overige bezittingen ontbreekt koershistorie."};
 if(coverage<1-1e-8||!dates.length||cashComponents.some(c=>!Number.isFinite(c.weight)))return {...base,reason:"Koers- of valutahistorie voor de huidige portefeuille is onvolledig."};
 // Exchanges have different holidays. Use the same intersection for ALL components;
 // never fill an absent stock return with zero or redistribute its weight.
 const common=dates.filter(d=>components.every(c=>c.points.has(d.date)&&datedFx(quotes,c.position.currency,d.date)!==null)&&cashComponents.every(c=>datedFx(quotes,c.currency,d.date)!==null));
 let value=1;
 const rows=common.map((p,i)=>{
  if(i){const before=common[i-1];let r=0;
   for(const c of components){const a=c.points.get(before.date)!,b=c.points.get(p.date)!;const factor=splits.filter(s=>s.symbol===c.position.ticker&&s.date>before.date&&s.date<=p.date).reduce((s,x)=>s*x.factor,1);r+=c.weight*(splitSafeReturn(a,b,factor)*datedFx(quotes,c.position.currency,before.date)!/datedFx(quotes,c.position.currency,p.date)!-1);}
   // Bank and broker cash do not automatically earn €STR. Foreign cash does carry FX risk.
   for(const c of cashComponents)r+=c.weight*(datedFx(quotes,c.currency,before.date)!/datedFx(quotes,c.currency,p.date)!-1);
   value*=1+r;
  }
  const usd=datedFx(quotes,"USD",p.date);return {date:p.date,value,benchmark:usd?p.close/usd:NaN};
 });
 return returnRisk(rows,quotes.estrHistory??[],coverage);
}
