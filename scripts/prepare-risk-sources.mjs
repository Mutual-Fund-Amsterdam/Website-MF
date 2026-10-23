import fs from 'node:fs/promises';
process.loadEnvFile('.env.local');
const sources={};
const {createLocalStore}=await import('../lib/portal/local-store.ts');
const local=createLocalStore(process.env.MF_AUTH_PEPPER);
sources.quotes=await local.get('mf:portal:development:daily-quotes');
const url=process.env.UPSTASH_REDIS_REST_URL??process.env.KV_REST_API_URL;
const token=process.env.UPSTASH_REDIS_REST_TOKEN??process.env.KV_REST_API_TOKEN;
if(url&&token){
 const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(['GET','mf:portal:production:daily-quotes'])});
 if(!response.ok)throw new Error(`Quotes store ${response.status}`);
 const payload=await response.json(); sources.quotes=typeof payload.result==='string'?JSON.parse(payload.result):payload.result;
}
for(const [name,series] of [['fx','EXR/D.USD.EUR.SP00.A'],['estr','EST/B.EU000A2X2A25.WT']]){
 const response=await fetch(`https://data-api.ecb.europa.eu/service/data/${series}?startPeriod=2011-01-01&format=csvdata`);
 if(!response.ok)throw new Error(`ECB ${name} ${response.status}`);
 const rows=(await response.text()).trim().split(/\r?\n/).map(r=>r.split(',')); const header=rows.shift();
 const d=header.indexOf('TIME_PERIOD'),v=header.indexOf('OBS_VALUE');
 sources[name]=rows.map(r=>({date:r[d],value:Number(r[v])})).filter(p=>/^\d{4}-\d{2}-\d{2}$/.test(p.date)&&Number.isFinite(p.value)).sort((a,b)=>a.date.localeCompare(b.date));
}
await fs.writeFile('../.codex-build/risk-sources.json',JSON.stringify(sources));
console.log({quotes:!!sources.quotes,benchmark:sources.quotes?.benchmark?.points?.length,fx:sources.fx.length,estr:sources.estr.at(-1)});
