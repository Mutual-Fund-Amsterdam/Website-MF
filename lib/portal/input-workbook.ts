import {createHash} from "node:crypto";
import type {Snapshot,FundNumber,MemberTransaction,Position} from "./types";
import {INPUT_CURRENCIES,isSplitWorkbook,splitInputSheet,splitCatalog} from "./split-workbook.ts";

export type InputCell=string|number|boolean|Date|null;
export type InputSheet={sheet:string;data:InputCell[][]};
type Row=Record<string,InputCell|undefined>;
const text=(v:InputCell|undefined)=>v instanceof Date?v.toISOString().slice(0,10):String(v??"").trim();
const num=(v:InputCell|undefined)=>v===null||v===undefined||v===""?NaN:Number(typeof v==="string"?v.replace(",","."):v);
function date(v:InputCell|undefined){const s=text(v),d=/^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s),r=d?`${d[3]}-${d[2].padStart(2,"0")}-${d[1].padStart(2,"0")}`:s;if(!/^\d{4}-\d{2}-\d{2}$/.test(r)||!Number.isFinite(Date.parse(r))||new Date(r).toISOString().slice(0,10)!==r)throw Error("Ongeldige datum in Invoer.");return r;}
function fund(v:InputCell|undefined):FundNumber{const n=num(v);if(n!==1&&n!==2&&n!==3)throw Error("Kies fonds 1, 2 of 3 in Invoer.");return n;}
function required(v:InputCell|undefined,name:string){const s=text(v);if(!s)throw Error(`${name} ontbreekt in Invoer.`);return s;}
function positive(v:InputCell|undefined,name:string,zero=false){const n=num(v);if(!Number.isFinite(n)||(zero?n<0:n<=0))throw Error(`Ongeldig ${name} in Invoer.`);return n;}
function rows(sheet:InputSheet,section:string):Row[]{
 const at=sheet.data.findIndex(r=>text(r[0])===`#${section}`);if(at<0)throw Error(`Invoerblok ${section} ontbreekt.`);
 const headers=sheet.data[at+1].map(text),result:Row[]=[];
 for(let i=at+2;i<sheet.data.length&&!text(sheet.data[i][0]).startsWith("#");i++){
  const r=Object.fromEntries(headers.map((h,c)=>[h,sheet.data[i][c]]));
  if(!text(r["Invoer-ID"])&&text(r.Verwerking)!=="Klaar")continue;
  if(!text(r.Verwerking)||text(r.Verwerking)==="Concept")continue;
  if(text(r.Verwerking)!=="Klaar")throw Error(`Ongeldige Verwerking op Invoer rij ${i+1}.`);
  required(r["Invoer-ID"],"Invoer-ID");r.__row=i+1;result.push(r);
 }
 return result;
}

/** Every parse replays the dated inputs from the immutable migration baseline. */
export function applyInputWorkbook(snapshot:Snapshot,sheets:InputSheet[],digestCode:(id:string,code:string)=>string,previous?:Snapshot|null):Snapshot{
 const split=isSplitWorkbook(sheets),sheet=splitInputSheet(sheets)??sheets.find(s=>s.sheet==="Invoer");if(!sheet)return snapshot;
 if(text(sheet.data[0]?.[1])!=="MF-INVOER-2")throw Error("Ongeldige versie van tabblad Invoer.");
 const cutoff=date(sheet.data[2]?.[1]);
 const fingerprints:Record<string,string>={},seen=new Set<string>();
 const sections=Object.fromEntries(["LEDEN","AANDELEN","LEDENMUTATIES","SALDI"].map(s=>[s,rows(sheet,s)]));
 for(const [section,entries] of Object.entries(sections))for(const r of entries){
  const id=text(r["Invoer-ID"]);if(seen.has(id))throw Error(`Dubbel Invoer-ID ${id}.`);seen.add(id);
  if(section!=="LEDEN"&&!(split&&section==="SALDI")){
   const keys=split?(section==="AANDELEN"?["Invoer-ID","Datum","Fonds","Handeling","Ticker","Aantal","Prijs","Valuta","Broker","Kosten","Beurs"]:["Invoer-ID","Datum","Fonds","Lid-ID","Handeling","Bedrag EUR","Boekingsprijs","Naar fonds","Naar lid-ID","Boekingsprijs nieuw fonds"]):null;
   fingerprints[id]=createHash("sha256").update(JSON.stringify(keys?keys.map(k=>[k,text(r[k])]):Object.entries(r).filter(([k])=>!["__row","Controle","Cashmutatie"].includes(k)).map(([k,v])=>[k,text(v)]))).digest("hex");
  }
 }
 const knownMembers=new Map(snapshot.members.map(m=>[m.key,m]));
 // Autosave of a draft must not roll an earlier published member edit back to the migration baseline.
 for(const m of previous?.members??[])knownMembers.set(m.key,{...m});
 const seenMemberKeys=new Set<string>();
 for(const r of sections.LEDEN){
  const f=fund(r.Fonds),id=required(r["Lid-ID"],"Lid-ID"),key=`${f}:${id}`,existing=knownMembers.get(key);
  if(seenMemberKeys.has(key))throw Error(`Dubbel lid ${id} in Invoer.`);seenMemberKeys.add(key);
  const role=required(r.Rol,"Rol"),status=required(r.Status,"Status");
  if(!["Lid","Fondsbestuurder","Hoofdbestuurder"].includes(role)||!["Actief","Inactief"].includes(status))throw Error(`Ongeldige rol of status bij lid ${id}.`);
  const allowed=required(r["Toegang fondsen"],"Toegang fondsen").split(/[;,]/).map(x=>fund(x.trim()));
  knownMembers.set(key,{...(existing??{participation:0,firstEntry:null,lastTransaction:null,sourceValue:null,deposits:0,withdrawals:0}),key,id,fund:f,name:required(r.Naam,"Naam"),role,active:status==="Actief",allowedFunds:[...new Set([f,...allowed])].sort(),loginDigest:digestCode(id,required(r["Persoonlijke code"],"Persoonlijke code"))});
 }
 snapshot.members=[...knownMembers.values()];
 if(split)for(const m of snapshot.members)if(!seenMemberKeys.has(m.key))throw Error(`Lid ${m.id} ontbreekt op Leden. Bewaar de rij en kies Inactief bij vertrek; gebruik Ledenmutaties voor een fondswissel.`);
 const loginIds=snapshot.members.filter(m=>m.active).map(m=>m.id.normalize("NFKC").toLowerCase());
 if(new Set(loginIds).size!==loginIds.length)throw Error("Dubbel actief Lid-ID in Invoer.");
 if(!snapshot.members.some(m=>m.active&&m.role==="Hoofdbestuurder"))throw Error("Er moet minstens één actieve hoofdbestuurder blijven.");
 type Movement={fund:FundNumber;date:string;account:string;currency:string;amount:number};const movements:Movement[]=[];
 const positions=new Map(snapshot.positions.map(p=>[`${p.fund}|${p.exchange}|${p.ticker.toUpperCase()}`,{...p}]));
 const ordered=(section:string)=>sections[section].sort((a,b)=>date(a.Datum).localeCompare(date(b.Datum))||Number(a.__row)-Number(b.__row));
 const eventDate=(r:Row)=>{const d=date(r.Datum);if(d<=cutoff)throw Error(`Datum moet na de basisdatum ${cutoff} liggen (rij ${r.__row}).`);if(d>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Amsterdam"}).format(new Date()))throw Error("Vul alleen uitgevoerde mutaties in; de datum ligt in de toekomst.");return d;};
 for(const r of ordered("AANDELEN")){
  const d=eventDate(r),f=fund(r.Fonds),ticker=required(r.Ticker,"Ticker").toUpperCase(),exchange=required(r.Beurs,"Beurs"),id=`${f}|${exchange}|${ticker}`,old=positions.get(id);
  const kind=required(r.Handeling,"Handeling"),buy=kind==="Koop";if(!buy&&kind!=="Verkoop")throw Error("Kies Koop of Verkoop.");
  const q=positive(r.Aantal,"aantal"),price=positive(r.Prijs,"prijs"),cost=positive(r.Kosten,"kosten",true),currency=required(r.Valuta,"Valuta").toUpperCase(),broker=required(r.Broker,"Broker");
  if(!INPUT_CURRENCIES.includes(currency)||!["IBKR","Saxo"].includes(broker))throw Error("Ongeldige valuta of broker in Invoer.");
  if(old&&old.currency!==currency)throw Error("Valuta wijkt af van de bestaande positie.");
  const quantity=(old?.quantity??0)+(buy?q:-q);if(quantity<-.00000001)throw Error(`Verkoop van ${ticker} is groter dan de positie.`);
  const p:Position=old??{fund:f,ticker,exchange,quantity:0,name:required(r.Aandeel,"Aandeel"),currency,isin:split?text(r.ISIN):required(r.ISIN,"ISIN"),marketSymbol:required(r.Koerscode,"Koerscode"),tradingViewSymbol:required(r["TradingView-code"],"TradingView-code"),sector:required(r.Sector,"Sector")};
  positions.set(id,{...p,quantity:Math.max(0,quantity)});
  const settlement=date(r.Afwikkeldatum??r.Datum);if(settlement!==d)throw Error("Afwikkeling op een andere dag vereist eerst beoordeling van de openstaande afwikkeling.");
  const delta=(buy?-1:1)*q*price-cost;if(!Number.isFinite(delta))throw Error("Transactiebedrag is te groot of ongeldig.");movements.push({fund:f,date:d,account:"Broker",currency,amount:delta});
  if(snapshot.ledger)snapshot.ledger.broker.push({id:`invoer:${text(r["Invoer-ID"])}`,fund:f,date:d,broker,kind:buy?"Buy":"Sell",symbol:ticker,description:`${kind} ${ticker}`,quantity:buy?q:-q,price,currency,grossEur:currency==="EUR"?(buy?-1:1)*q*price:null,commissionEur:currency==="EUR"?-cost:null,netEur:currency==="EUR"?delta:null,nativeCash:delta,assetClass:"STK",exchange,status:"Goedgekeurd",source:"Invoer",sourceHash:fingerprints[text(r["Invoer-ID"])],sourceRow:Number(r.__row),cashCurrency:currency,cashDelta:delta,settlementDate:settlement});
 }
 snapshot.positions=[...positions.values()].filter(p=>p.quantity>1e-8);
 if(split){const catalog=new Map(splitCatalog(sheets).map(r=>[text(r.Ticker).toUpperCase(),r]));for(const p of snapshot.positions){const a=catalog.get(p.ticker);if(!a)throw Error(`Aandeel ${p.ticker} ontbreekt op Aandelen.`);if(text(a.Valuta)!==p.currency||text(a.Beurs)!==p.exchange)throw Error(`Beurs of valuta van bestaande positie ${p.ticker} is gewijzigd. Gebruik een aparte ticker voor een andere notering.`);p.name=required(a.Aandeel,"Aandeel");p.isin=text(a.ISIN);p.marketSymbol=required(a.Koerscode,"Koerscode");p.tradingViewSymbol=required(a["TradingView-code"],"TradingView-code");p.sector=required(a.Sector,"Sector");}}
 const newEvents:MemberTransaction[]=[];
 const navAt=(f:FundNumber,d:string,raw:InputCell|undefined)=>{const explicit=num(raw);const nav=Number.isFinite(explicit)?explicit:snapshot.fundHistory?.find(p=>p.fund===f&&p.date===d)?.nav;if(!nav||nav<=0)throw Error(`Boekingsprijs ontbreekt voor fonds ${f} op ${d}. Vul de gecontroleerde boekingsprijs in.`);return nav;};
 for(const r of ordered("LEDENMUTATIES")){
  const f=fund(r.Fonds),d=eventDate(r),id=required(r["Lid-ID"],"Lid-ID"),kind=required(r.Handeling,"Handeling"),member=knownMembers.get(`${f}:${id}`);
  if(!member)throw Error(`Lid ${id} ontbreekt in fonds ${f}.`);
  if(!["Storting","Opname","Uitstap","Fondswissel"].includes(kind))throw Error("Ongeldige ledenmutatie.");
  const amount=positive(r["Bedrag EUR"],"bedrag EUR"),sign=kind==="Storting"?1:-1,nav=navAt(f,d,r.Boekingsprijs);
  newEvents.push({fund:f,memberId:id,date:d,amount:sign*amount,nav,units:sign*amount/nav,source:`Invoer:${text(r["Invoer-ID"])}`});
  const paid=date(r.Gelddatum??r.Datum);if(paid!==d)throw Error("Gelddatum en boekingsdatum verschillen; deze mutatie vereist eerst beoordeling van geld onderweg.");
  movements.push({fund:f,date:paid,account:"ING",currency:"EUR",amount:sign*amount});
  if(kind==="Fondswissel"){
   const dest=fund(r["Naar fonds"]),destId=required(r["Naar lid-ID"],"Naar lid-ID");if(dest===f||!knownMembers.has(`${dest}:${destId}`))throw Error("Bestemmingsfonds of bestemmingslid ontbreekt bij fondswissel.");
   const destNav=navAt(dest,d,r["Boekingsprijs nieuw fonds"]);newEvents.push({fund:dest,memberId:destId,date:d,amount,nav:destNav,units:amount/destNav,source:`Invoer:${text(r["Invoer-ID"])}`});
   movements.push({fund:dest,date:paid,account:"ING",currency:"EUR",amount});
  }
  if(kind==="Uitstap")member.active=false;
 }
 if(newEvents.length)snapshot.transactions=[...(snapshot.transactions??[]),...newEvents].sort((a,b)=>a.date.localeCompare(b.date));
 if(newEvents.length){
  if(!snapshot.totalUnitsByFund)throw Error("Basisdeelbewijzen ontbreken.");
  for(const e of newEvents)snapshot.totalUnitsByFund[e.fund]+=e.units;
  for(const m of snapshot.members){const own=(snapshot.transactions??[]).filter(e=>e.fund===m.fund&&e.memberId===m.id);let units=0;for(const e of own){units+=e.units;if(units< -1e-8)throw Error(`Opname groter dan de opgebouwde positie van lid ${m.id}.`);}
   if(snapshot.totalUnitsByFund[m.fund]<=0)throw Error("Fondsdeelbewijzen mogen niet nul of negatief worden.");
   m.participation=Math.max(0,units)/snapshot.totalUnitsByFund[m.fund];m.firstEntry=own.find(e=>e.amount>0)?.date??null;m.lastTransaction=own.at(-1)?.date??null;m.deposits=own.filter(e=>e.amount>0).reduce((s,e)=>s+e.amount,0);m.withdrawals=-own.filter(e=>e.amount<0).reduce((s,e)=>s+e.amount,0);
   if(sections.LEDENMUTATIES.some(r=>text(r.Handeling)==="Uitstap"&&fund(r.Fonds)===m.fund&&text(r["Lid-ID"])===m.id)&&Math.abs(units)>1e-6)throw Error(`Uitstap van lid ${m.id} laat nog deelbewijzen over. Gebruik Opname of corrigeer het bedrag.`);
  }
 }
 const checkpoints=new Map<string,{date:string;amount:number}>(),checkpointDates=new Set<string>();
 for(const r of sections.SALDI){
  const f=fund(r.Fonds),d=date(r.Datum),account=required(r.Rekening,"Rekening"),currency=required(r.Valuta,"Valuta"),amount=num(r.Saldo);
  const base=snapshot.cash.find(c=>c.fund===f),baseDate=account==="ING"?base?.ingAsOf:account==="Overig"?base?.otherAsOf:base?.brokerAsOf;
  if(d<(split?(baseDate??cutoff):cutoff)||d>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Amsterdam"}).format(new Date()))throw Error("Saldodatum ligt vóór de bestaande stand of in de toekomst.");
  if(!Number.isFinite(amount)||!["ING","Broker","Overig"].includes(account)||!INPUT_CURRENCIES.includes(currency)||(account!=="Broker"&&currency!=="EUR"))throw Error("Ongeldig saldo, rekening of valuta op Cash.");
  const key=`${f}|${account}|${currency}`,old=checkpoints.get(key);if(checkpointDates.has(`${key}|${d}`)||(split&&old))throw Error("Gebruik op Cash één rij per fonds, rekening en valuta. Werk die rij bij met het nieuwe saldo en de datum.");checkpointDates.add(`${key}|${d}`);if(!old||old.date<d)checkpoints.set(key,{date:d,amount});
 }
 for(const c of snapshot.cash){
  const specs=[['ING','EUR','ingEur','ingAsOf'],['Broker','EUR','brokerEur','brokerAsOf'],['Broker','USD','brokerUsd','brokerAsOf'],['Broker','CAD','brokerCad','brokerAsOf'],['Overig','EUR','otherEur','otherAsOf']] as const;
  const baseDates={...c};for(const [account,currency,amountKey,dateKey] of specs){const cp=checkpoints.get(`${c.fund}|${account}|${currency}`),base=cp?.amount??c[amountKey],asOf=cp?.date??baseDates[dateKey];const changes=movements.filter(m=>m.fund===c.fund&&m.account===account&&m.currency===currency&&(!asOf||m.date>asOf));if(changes.length&&base===null)throw Error("Beginsaldo ontbreekt voor een geldmutatie.");c[amountKey]=base===null?null:Math.round((base+changes.reduce((s,m)=>s+m.amount,0))*100)/100;c[dateKey]=[c[dateKey],cp?.date,...changes.map(m=>m.date)].filter((x):x is string=>!!x).sort().at(-1)??null;}
  for(const currency of INPUT_CURRENCIES.filter(v=>!["EUR","USD","CAD"].includes(v))){
   const cp=checkpoints.get(`${c.fund}|Broker|${currency}`),prior=c.extraBalances?.[currency];
   const changes=movements.filter(m=>m.fund===c.fund&&m.currency===currency&&(!cp||m.date>cp.date));
   if(!cp&&!prior&&!changes.length)continue;
   if(!cp&&!prior)throw Error(`Vul eerst het brokersaldo in ${currency} in op Cash voor fonds ${c.fund}.`);
   const after=cp?.date??prior!.date,amount=(cp?.amount??prior!.amount)+changes.filter(m=>m.date>after).reduce((s,m)=>s+m.amount,0);
   c.extraBalances={...c.extraBalances,[currency]:{amount:Math.round(amount*100)/100,date:[after,...changes.map(m=>m.date)].sort().at(-1)!}};
  }
 }
 if(snapshot.cash.some(c=>[c.ingEur,c.brokerEur,c.brokerUsd,c.brokerCad,c.otherEur].some(v=>v!==null&&!Number.isFinite(v)))||snapshot.members.some(m=>m.participation!==null&&!Number.isFinite(m.participation))||snapshot.positions.some(p=>!Number.isFinite(p.quantity))||Object.values(snapshot.totalUnitsByFund??{}).some(v=>!Number.isFinite(v)))throw Error("Ongeldig berekend bedrag of aantal. Controleer Invoer.");
 snapshot.input={version:split?3:2,cutoff,events:fingerprints};
 return snapshot;
}

export function validateInputContinuity(next:Snapshot,previous:Snapshot|null){
 if(!previous?.input)return;
 if(!next.input||next.input.cutoff!==previous.input.cutoff)throw Error("Invoerbasis ontbreekt of is gewijzigd. Gebruik de actuele master.");
 for(const [id,hash] of Object.entries(previous.input.events))if(next.input.events[id]!==hash)throw Error(`Verwerkte invoer ${id} is gewijzigd of verwijderd. Voeg een nieuwe correctieregel toe.`);
 for(const m of previous.members)if(!next.members.some(n=>n.key===m.key))throw Error(`Lid ${m.id} is verwijderd. Gebruik Inactief om de historie te bewaren.`);
}
