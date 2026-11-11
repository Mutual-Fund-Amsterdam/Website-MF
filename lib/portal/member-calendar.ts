import type {MemberHistoryPoint} from './member-history';
export function memberCalendar(points:MemberHistoryPoint[],end:string,start='2026-09-16'){
 const rows=[...points].filter(p=>p.date<=end).sort((a,b)=>a.date.localeCompare(b.date));
 const byDate=new Map(rows.map(p=>[p.date,p]));let i=0,last:MemberHistoryPoint|undefined;
 const out=[];
 for(let t=Date.parse(start+'T00:00:00Z');t<=Date.parse(end+'T00:00:00Z');t+=86400000){
  const date=new Date(t).toISOString().slice(0,10);
  while(i<rows.length&&rows[i].date<=date)last=rows[i++];
  const point=byDate.get(date);
  const beforeParticipation=rows.length>0&&date<rows[0].date;
  out.push({date,timestamp:t,value:point?.value??(beforeParticipation?0:null),netInleg:last?.netInleg??(beforeParticipation?0:null),reconstructed:!!point?.indicative});
 }
 return out;
}
