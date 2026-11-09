import type {InputSheet} from './input-workbook';
import type {Snapshot,FundNumber,DailyQuotes} from './types';
import {quoteKey} from './marketstack';
const txt=(v:unknown)=>String(v??'').trim();
const day=(v:unknown)=>v instanceof Date?v.toISOString().slice(0,10):txt(v);
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam'}).format(new Date());
const validDay=(d:string)=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d&&d<=today();

/** Current member units are the source. Legacy administration EUR totals are
 * reference calculations, not broker statements and not current NAV anchors. */
export function applyUnitLedger(snapshot:Snapshot,sheets:InputSheet[]){
 const ix=sheets.find(s=>s.sheet==='Fondsindex');
 if(txt(ix?.data[3]?.[15])!=='MF-UNITS-1')return;
 const dates={} as Record<FundNumber,string>;
 for(const row of ix!.data.slice(4,7)){
  const fund=Number(row[6]) as FundNumber,asOf=day(row[11]),payable=Number(row[12]??0),payableDate=day(row[14]);
  if(![1,2,3].includes(fund)||dates[fund]||!validDay(asOf)||!Number.isFinite(payable)||payable<0||Math.abs(payable*100-Math.round(payable*100))>1e-6||!validDay(payableDate))throw Error('Ongeldige deelbewijzenbasis of uitbetalingsverplichting in Fondsindex.');
  dates[fund]=asOf;
  const units=(snapshot.transactions??[]).filter(e=>e.fund===fund).reduce((n,e)=>n+e.units,0);
  if(!snapshot.totalUnitsByFund||units<=0||Math.abs(units-snapshot.totalUnitsByFund[fund])>1e-6)throw Error(`Deelbewijzen van fonds ${fund} sluiten niet aan op de huidige ledenboekingen.`);
  const cash=snapshot.cash.find(c=>c.fund===fund)!;cash.payablesEur=payable;cash.payablesAsOf=payableDate;
 }
 if(Object.keys(dates).length!==3)throw Error('Peildatum van deelbewijzen ontbreekt.');
 snapshot.unitLedger={version:1,asOf:dates};
 const controls=sheets.find(s=>s.sheet==='Overzicht');
 const header=controls?.data.findIndex(r=>r.includes('Brondeelbewijzen'))??-1;
 if(controls&&header>=0){
  const headers=controls.data[header].map(txt),col=(n:string)=>headers.indexOf(n);
  for(const row of controls.data.slice(header+1)){
   const id=txt(row[col('Lid-ID')]);if(!id)break;
   const check=snapshot.ledger?.members.find(m=>m.id===id&&m.fund===Number(row[col('Fonds')]));
   if(check){check.sourceUnits=Number(row[col('Brondeelbewijzen')]);check.sourceUnitTolerance=Number(row[col('Tolerantie deelbewijzen')]);}
  }
 }
 const sheet=sheets.find(s=>s.sheet==='Koersen');
 if(!sheet)return;
 snapshot.manualPrices=[];
 for(const row of sheet.data.slice(5)){
  if(!txt(row[1]))continue;
  const ticker=txt(row[1]).toUpperCase(),exchange=txt(row[2]),date=day(row[3]),close=Number(row[4]),currency=txt(row[5]);
  const position=snapshot.positions.find(p=>p.ticker===ticker&&p.exchange===exchange&&p.currency===currency);
  if(!position)throw Error(`Koers ${ticker}: aandeel, beurs of valuta ontbreekt in de portefeuille.`);
  if(!validDay(date)||!Number.isFinite(close)||close<=0)throw Error(`Ongeldige koers of koersdatum voor ${ticker}.`);
  snapshot.manualPrices.push({symbol:ticker,exchange,currency,date,close,source:txt(row[7])||'Handmatige koers in Excel'});
 }
}

/** Import only verified user-supplied observations; never calls a price API. */
export function mergeManualPrices(snapshot:Snapshot,previous:DailyQuotes|null):DailyQuotes|null{
 if(!snapshot.manualPrices?.length)return previous;
 const result:DailyQuotes={...(previous??{fetchedAt:new Date().toISOString()}),prices:{...previous?.prices},history:{...previous?.history}};
 let changed=false;
 for(const p of snapshot.manualPrices){
  const id=quoteKey({ticker:p.symbol,exchange:p.exchange}),old=result.prices[id];
  if(old&&old.date>=p.date)continue;
  result.prices[id]=p;
  result.history![id]=[...new Map([...(result.history![id]??[]),{date:p.date,close:p.close}].map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));changed=true;
 }
 if(changed)result.manualUpdatedAt=new Date().toISOString();
 return changed?result:previous;
}
