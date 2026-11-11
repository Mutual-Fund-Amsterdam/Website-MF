import type {DailyQuotes} from './types';
/** Select real saved FX observations only; no network, synthetic rates or future data. */
export function withCurrentFx(quotes:DailyQuotes,today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam'}).format(new Date())):DailyQuotes{
 const fx={...quotes.fx};let changed=false;
 const currencies=new Set([...Object.keys(quotes.fxHistory??{}),...(quotes.eurUsdHistory?.length?['USD']:[])]);
 for(const currency of currencies){
  const rows=[...(quotes.fxHistory?.[currency]??[]),...(currency==='USD'?quotes.eurUsdHistory??[]:[])];
  const point=rows.filter(p=>p.date<=today&&p.close>0&&Number.isFinite(p.close)).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
  if(point&&(!fx[currency]||point.date>fx[currency]!.date)){fx[currency]={currency,date:point.date,perEuro:point.close};changed=true;}
 }
 return changed?{...quotes,fx}:quotes;
}
