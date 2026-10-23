import type { DailyQuotes, FundNumber, FundValuePoint, Position, Snapshot } from "./types";

export type BankEvent = {
  id: string; fund: FundNumber; date: string; valueDate: string; amountCents: number;
  kind: string; description: string; counterparty: string; memberId: string; matchId: string;
  status: string; source: string; sourceHash: string; sourceRow: number;
};
export type BrokerEvent = {
  id: string; fund: FundNumber; date: string; broker: string; kind: string; symbol: string;
  description: string; quantity: number | null; price: number | null; currency: string;
  grossEur: number | null; commissionEur: number | null; netEur: number | null;
  nativeCash: number | null; assetClass: string; exchange: string; status: string;
  source: string; sourceHash: string; sourceRow: number;
  processing?: string; newSymbol?: string; factor?: number | null;
  cashCurrency?: string; cashDelta?: number | null; settlementDate?: string;
};
export type MemberCheck = { id: string; fund: FundNumber; sourceValue: number | null; sourceFirstEntry: string | null; sourceId: string };
export type ReconstructionLedger = { bank: BankEvent[]; broker: BrokerEvent[]; members: MemberCheck[] };
export type LedgerStorage = { digest: string; bankChunks: number; brokerChunks: number; members: MemberCheck[] };
export type ReviewIssue = { fund: FundNumber; category: string; item: string; source: number | null; master: number | null; detail: string };
export type BankControl = { fund: FundNumber; from: string | null; to: string | null; opening: number | null; closing: number | null; calculatedClosing: number | null; differenceCents: number | null; count: number };
export type ReconstructionDay = {
  fund: FundNumber; date: string; ing: number | null; stocks: number | null; brokerCash: number | null;
  other: number | null; inTransit: number; memberReceivable: number; units: number | null;
  unsettled: number;
  fundValue: number | null; nav: number | null; status: "review" | "incomplete" | "verified";
  reasons: string[];
};
export type ReconstructionAudit = { bank: BankControl[]; issues: ReviewIssue[]; bankRows: number; brokerRows: number; membersChecked: number; matchedTransfers: number; anchorDates: string[] };
const dayMs = 86400000;
const approved = (status: string) => status.trim().toLowerCase() === "goedgekeurd";
const isBankMovement = (e: BankEvent) => !["Bankopening", "Banksluiting"].includes(e.kind);
const chronology = (a: BrokerEvent, b: BrokerEvent) => a.date.localeCompare(b.date) || b.sourceRow - a.sourceRow;

export function validateLedger(ledger: ReconstructionLedger): void {
  if(ledger.bank.length>10000 || ledger.broker.length>20000) throw new Error("Te veel bronregels in de Excel.");
  const seen=new Set<string>();
  for(const e of [...ledger.bank,...ledger.broker]){
    if(!/^[a-f0-9]{64}$/.test(e.sourceHash)||!Number.isSafeInteger(e.sourceRow)||e.sourceRow<0||e.id!==`${e.sourceHash}:${e.sourceRow}`)throw new Error("Ongeldige bron-ID; behoud bronhash en bronregel.");
    if(seen.has(e.id))throw new Error("Dubbele bronregel in de Excel; dezelfde bron-ID is al aanwezig.");
    seen.add(e.id);
    if(![1,2,3].includes(e.fund)||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!Number.isFinite(Date.parse(e.date))||new Date(e.date).toISOString().slice(0,10)!==e.date)throw new Error("Ongeldige datum of fonds in bronregel.");
  }
  for(const e of ledger.bank) if(!Number.isSafeInteger(e.amountCents))throw new Error("Ongeldig bankbedrag; maximaal twee decimalen.");
  for(const e of ledger.broker){
    for(const n of [e.quantity,e.price,e.grossEur,e.commissionEur,e.netEur,e.nativeCash,e.factor,e.cashDelta])if(n!==null&&n!==undefined&&!Number.isFinite(n))throw new Error("Ongeldig getal in brokerregel.");
    if(e.processing==="Split"&&(!e.factor||e.factor<=0))throw new Error("Een split vereist een positieve factor.");
    if(e.processing==="Hernoeming"&&(!e.symbol||!e.newSymbol))throw new Error("Een hernoeming vereist beide tickers.");
    if(e.settlementDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(e.settlementDate)||!Number.isFinite(Date.parse(e.settlementDate))||new Date(e.settlementDate).toISOString().slice(0,10)!==e.settlementDate||e.settlementDate<e.date))throw new Error("Ongeldige afwikkeldatum in brokerregel.");
  }
  for(const fund of [1,2,3])if(new Set(ledger.broker.filter(e=>e.fund===fund&&["Ankerpositie","Ankercash","Ankertotaal"].includes(e.kind)).map(e=>e.date)).size>1)throw new Error("De brokervertrekstand moet per fonds één gezamenlijke datum hebben.");
}

export function bankControl(ledger: ReconstructionLedger, fund: FundNumber): BankControl {
  const rows=ledger.bank.filter(e=>e.fund===fund),open=rows.filter(e=>e.kind==="Bankopening"),close=rows.filter(e=>e.kind==="Banksluiting");
  const movements=rows.filter(isBankMovement);
  if(open.length!==1||close.length!==1)return {fund,from:null,to:null,opening:null,closing:null,calculatedClosing:null,differenceCents:null,count:movements.length};
  const sum=open[0].amountCents+movements.reduce((s,e)=>s+e.amountCents,0);
  return {fund,from:open[0].date,to:close[0].date,opening:open[0].amountCents/100,closing:close[0].amountCents/100,calculatedClosing:sum/100,differenceCents:sum-close[0].amountCents,count:movements.length};
}
export function bankValue(ledger: ReconstructionLedger,fund:FundNumber,date:string):number|null{
  const control=bankControl(ledger,fund);
  if(control.differenceCents!==0||!control.from||!control.to||date<control.from||date>control.to)return null;
  return (Math.round(control.opening!*100)+ledger.bank.filter(e=>e.fund===fund&&isBankMovement(e)&&e.date<=date).reduce((s,e)=>s+e.amountCents,0))/100;
}

export function holdingsAt(ledger: ReconstructionLedger,fund:FundNumber,date:string){
  const anchors=ledger.broker.filter(e=>e.fund===fund&&e.kind==="Ankerpositie");
  const anchor=anchors[0]?.date;
  const holdings=new Map<string,{symbol:string;currency:string;quantity:number;assetClass:string;exchange:string}>();
  const reasons:string[]=[];
  if(!anchor)return {holdings,anchor:null,reasons:["anker_ontbreekt"]};
  if(anchors.some(e=>e.date!==anchor))return {holdings,anchor:null,reasons:["meerdere_ankerdatums"]};
  for(const e of anchors)holdings.set(e.symbol,{symbol:e.symbol,currency:e.currency,quantity:e.quantity??0,assetClass:e.assetClass,exchange:e.exchange});
  const events=ledger.broker.filter(e=>e.fund===fund&&e.broker==="IBKR"&&e.date>=(date<anchor?date:anchor)&&e.date<=(date<anchor?anchor:date)&&e.date>(date<anchor?date:anchor)&&!["Ankerpositie","Ankercash","Ankertotaal"].includes(e.kind)).sort(chronology);
  const reverse=date<anchor;if(reverse)events.reverse();
  for(const e of events){
    if(e.processing==="Negeren"&&approved(e.status))continue;
    if(e.kind==="Buy"||e.kind==="Sell"||e.processing==="Aantalcorrectie"){
      if(e.processing==="Aantalcorrectie"&&!approved(e.status)){reasons.push("aantalcorrectie_niet_goedgekeurd");continue;}
      if(e.quantity===null||!e.symbol||!e.currency){reasons.push("transactie_aantal_ontbreekt");continue;}
      const h=holdings.get(e.symbol)??{symbol:e.symbol,currency:e.currency,quantity:0,assetClass:"stock",exchange:e.exchange};
      h.quantity+=(reverse?-1:1)*e.quantity;holdings.set(e.symbol,h);
    }else if(e.processing==="Split"&&approved(e.status)&&e.factor){
      const h=holdings.get(e.symbol);if(h)h.quantity*=reverse?1/e.factor:e.factor;
    }else if(e.processing==="Hernoeming"&&approved(e.status)&&e.newSymbol){
      const from=reverse?e.newSymbol:e.symbol,to=reverse?e.symbol:e.newSymbol,h=holdings.get(from);
      if(h){const old=holdings.get(to);holdings.delete(from);holdings.set(to,{...h,symbol:to,quantity:h.quantity+(old?.quantity??0)});}
    }else if(["Corporate Action","Cancel"].includes(e.kind)&&!(e.processing==="Negeren"&&approved(e.status))){reasons.push("bedrijfsactie_onopgelost");}
  }
  for(const h of holdings.values()){if(h.quantity<-.000001)reasons.push("negatief_historisch_aantal");if(Math.abs(h.quantity)<.000001)holdings.delete(h.symbol);}
  return {holdings,anchor,reasons:[...new Set(reasons)]};
}

/** Native cash is reconstructed only from explicit native movements, never from EUR translations. */
export function cashAt(ledger:ReconstructionLedger,fund:FundNumber,date:string){
  const anchors=ledger.broker.filter(e=>e.fund===fund&&e.kind==="Ankercash"),anchor=anchors[0]?.date;
  const cash=new Map<string,number>();const reasons:string[]=[];
  if(!anchor)return {cash,reasons:["brokercash_anker_ontbreekt"]};
  for(const e of anchors)cash.set(e.currency,e.nativeCash??0);
  const reverse=date<anchor;
  for(const e of ledger.broker.filter(e=>e.fund===fund&&(e.settlementDate||e.date)>(reverse?date:anchor)&&(e.settlementDate||e.date)<=(reverse?anchor:date))){
    if(["Ankerpositie","Ankercash","Ankertotaal","Brokeropening","Brokersluiting"].includes(e.kind))continue;
    if(e.processing==="Negeren"&&approved(e.status))continue;
    // Translation P&L is not a receipt/payment. It is accounted for by daily FX conversion.
    if(e.kind==="Adjustment"&&/FX Translations P&L/i.test(e.description))continue;
    if(["Buy","Sell"].includes(e.kind)&&!e.settlementDate)reasons.push("afwikkeldatum_ontbreekt");
    if(e.cashCurrency&&e.cashDelta!==null&&e.cashDelta!==undefined&&approved(e.status)){
      cash.set(e.cashCurrency,(cash.get(e.cashCurrency)??0)+(reverse?-1:1)*e.cashDelta);
    }else if((e.netEur??0)!==0||["Buy","Sell","Forex Trade Component"].includes(e.kind)) reasons.push("native_cashmutatie_ontbreekt");
  }
  return {cash,reasons:[...new Set(reasons)]};
}

export function unsettledValue(ledger:ReconstructionLedger,quotes:DailyQuotes|null,fund:FundNumber,date:string){
  let value=0;const reasons:string[]=[];
  for(const e of ledger.broker.filter(e=>e.fund===fund&&["Buy","Sell"].includes(e.kind)&&e.date<=date&&(e.settlementDate||e.date)>date)){
    if(e.processing==="Negeren"&&approved(e.status))continue;
    const fx=e.cashCurrency?fxAt(quotes,e.cashCurrency,date):null;
    if(!fx||!approved(e.status)||e.cashDelta===null||e.cashDelta===undefined)reasons.push("afwikkeling_onvolledig");
    else value+=e.cashDelta/fx;
  }
  return {value,reasons};
}

export function transfersInTransit(ledger:ReconstructionLedger,fund:FundNumber,date:string){
  let value=0;const missing:string[]=[];
  for(const b of ledger.bank.filter(e=>e.fund===fund&&e.kind==="Brokertransfer")){
    const r=ledger.broker.find(e=>e.id===b.matchId&&e.fund===fund&&["Deposit","Withdrawal"].includes(e.kind));
    if(!r||Math.round((r.netEur??0)*100)!==-b.amountCents){missing.push("brokertransfer_ongekoppeld");continue;}
    const from=b.date<r.date?b.date:r.date,to=b.date>r.date?b.date:r.date;
    if(date>=from&&date<to){
      // Only an outgoing leg before the incoming leg creates a receivable.
      const firstAmount=b.date<r.date?b.amountCents/100:r.netEur!;
      value-=firstAmount;
    }
  }
  return {value,reasons:[...new Set(missing)]};
}

export function memberReceivables(snapshot:Snapshot,ledger:ReconstructionLedger,fund:FundNumber,date:string){
  let value=0;const reasons:string[]=[];const used=new Set<string>();
  const events=linkedMemberEvents(snapshot);
  for(const event of events){
    if(event.fund!==fund||event.date>date)continue;
    const candidates=ledger.bank.filter(b=>b.fund===fund&&b.memberId===event.memberId&&(!b.matchId||b.matchId===event.link)&&approved(b.status)&&b.amountCents===Math.round(event.amount*100)&&!used.has(b.id));
    if(candidates.length!==1){reasons.push("ledenbetaling_niet_afgestemd");continue;}
    const bank=candidates[0];used.add(bank.id);if(bank.date>date)value+=event.amount;
  }
  // Paid before economic entry is a liability until units are issued.
  for(const bank of ledger.bank.filter(b=>b.fund===fund&&b.memberId&&approved(b.status)&&b.date<=date)){
    const matches=events.filter(e=>e.fund===fund&&e.memberId===bank.memberId&&(!bank.matchId||bank.matchId===e.link)&&Math.round(e.amount*100)===bank.amountCents);
    if(matches.length===1&&matches[0].date>date)value-=bank.amountCents/100;
  }
  return {value,reasons:[...new Set(reasons)]};
}

export function linkedMemberEvents(snapshot:Snapshot){
  const counts=new Map<string,number>();
  return (snapshot.transactions??[]).map(e=>{
    const key=`lid:${e.fund}:${e.memberId}:${e.date}:${e.amount.toFixed(2)}:${e.nav.toPrecision(12)}`;
    const n=(counts.get(key)??0)+1;counts.set(key,n);return {...e,link:`${key}:${n}`};
  });
}

export function auditLedger(snapshot:Snapshot):ReconstructionAudit|null{
  const ledger=snapshot.ledger;if(!ledger)return null;
  const bank=([1,2,3] as const).map(f=>bankControl(ledger,f));const issues:ReviewIssue[]=[];
  for(const f of [1,2,3] as const){
    const expected=holdingsAt(ledger,f,"2026-10-21");const actual=snapshot.positions.filter(p=>p.fund===f);
    for(const symbol of new Set([...expected.holdings.values()].filter(p=>p.assetClass==="stock").map(p=>p.symbol).concat(actual.map(p=>p.ticker)))){
      if(symbol==="CTPNX.RTS")continue;
      const q=expected.holdings.get(symbol)?.quantity??0,master=actual.filter(p=>p.ticker===symbol).reduce((s,p)=>s+p.quantity,0);
      if(Math.abs(q-master)>.000001)issues.push({fund:f,category:"Aantallen",item:symbol,source:q,master,detail:"IBKR-anker + transacties t/m 21-10 versus master; Saxo kan het verschil verklaren."});
    }
    const control=bank.find(b=>b.fund===f)!;
    const masterCash=snapshot.cash.find(c=>c.fund===f);
    if(masterCash?.ingAsOf&&masterCash.ingEur!==null){const onDate=bankValue(ledger,f,masterCash.ingAsOf);if(onDate!==null&&Math.abs(onDate-masterCash.ingEur)>.005)issues.push({fund:f,category:"ING-peildatum",item:masterCash.ingAsOf,source:onDate,master:masterCash.ingEur,detail:"ING-bedrag versus bankreconstructie op dezelfde peildatum. Eerst beoordelen; het bedrag kan bij een latere datum horen."});}
    if(control.differenceCents!==0)issues.push({fund:f,category:"ING",item:"Saldi sluiten niet aan",source:control.closing,master:control.calculatedClosing,detail:"Geen gecontroleerde dagreeks zolang de bankcontrole niet aansluit."});
    const anchor=ledger.broker.filter(e=>e.fund===f&&e.kind==="Ankertotaal");
    const parts=ledger.broker.filter(e=>e.fund===f&&["Ankerpositie","Ankercash"].includes(e.kind)).reduce((s,e)=>s+(e.grossEur??0),0);
    if(anchor.length!==1||Math.abs(parts-(anchor[0]?.grossEur??0))>.03)issues.push({fund:f,category:"Anker",item:"Brokervertrekstand",source:anchor[0]?.grossEur??null,master:parts,detail:"Anker ontbreekt of onderdelen sluiten niet aan."});
    if(ledger.broker.some(e=>e.fund===f&&["Ankerpositie","Ankercash","Ankertotaal"].includes(e.kind)&&!approved(e.status)))issues.push({fund:f,category:"Beoordeling",item:"Vertrekstand 05-10-2026",source:null,master:null,detail:"Nog niet goedgekeurd; bestaande masterbedragen zijn behouden."});
    const closing=ledger.broker.find(e=>e.fund===f&&e.kind==="Brokersluiting");
    const openingCash=ledger.broker.filter(e=>e.fund===f&&e.kind==="Ankercash").reduce((s,e)=>s+(e.grossEur??0),0);
    if(closing)issues.push({fund:f,category:"Cashcontrole",item:"IBKR 05-10 versus 21-10",source:openingCash,master:closing.netEur,detail:"Beide bedragen zijn bronstanden in EUR op verschillende datums. De actuele native saldi in de master worden hiermee niet automatisch vervangen."});
  }
  for(const c of ledger.members){
    const member=snapshot.members.find(m=>m.id===c.id&&m.fund===c.fund),nav=(snapshot.fundHistory??[]).filter(p=>p.fund===c.fund).sort((a,b)=>a.date.localeCompare(b.date)).at(-1)?.nav;
    const units=(snapshot.transactions??[]).filter(e=>e.fund===c.fund&&e.memberId===c.id).reduce((s,e)=>s+e.units,0);
    const value=nav===undefined?null:units*nav;
    if(!member||c.sourceValue===null||value===null||Math.abs(value-c.sourceValue)>.02||member.firstEntry!==c.sourceFirstEntry)issues.push({fund:c.fund,category:"Leden",item:c.id,source:c.sourceValue,master:value,detail:`Instap bron ${c.sourceFirstEntry??"onbekend"}; master ${member?.firstEntry??"onbekend"}.`});
  }
  for(const m of snapshot.members)if(ledger.members.filter(c=>c.id===m.id&&c.fund===m.fund).length!==1)issues.push({fund:m.fund,category:"Leden",item:m.id,source:null,master:null,detail:"Een unieke controle tegen de ledenbron ontbreekt."});
  return {bank,issues,bankRows:ledger.bank.filter(isBankMovement).length,brokerRows:ledger.broker.length,membersChecked:ledger.members.length,matchedTransfers:ledger.bank.filter(b=>b.kind==="Brokertransfer"&&b.matchId).length,anchorDates:[...new Set(ledger.broker.filter(e=>e.kind==="Ankertotaal").map(e=>e.date))]};
}

function fxAt(quotes:DailyQuotes|null,currency:string,date:string):number|null{
  if(currency==="EUR")return 1;
  const rates=currency==="USD"?quotes?.eurUsdHistory:quotes?.fxHistory?.[currency];
  const rate=rates?.filter(p=>p.date<=date).at(-1);
  return rate&&Date.parse(date)-Date.parse(rate.date)<=7*dayMs&&rate.close>0?rate.close:null;
}

export function valueLedgerDay(snapshot:Snapshot,quotes:DailyQuotes|null,fund:FundNumber,date:string):ReconstructionDay{
  const ledger=snapshot.ledger!;const h=holdingsAt(ledger,fund,date),cash=cashAt(ledger,fund,date),transit=transfersInTransit(ledger,fund,date),members=memberReceivables(snapshot,ledger,fund,date),settlement=unsettledValue(ledger,quotes,fund,date);
  const reasons=[...h.reasons,...cash.reasons,...transit.reasons,...members.reasons,...settlement.reasons];
  const ing=bankValue(ledger,fund,date);if(ing===null)reasons.push("ING_dekking_ontbreekt");
  const unitPoint=(snapshot.fundHistory??[]).filter(p=>p.fund===fund&&p.date<=date).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
  let units=unitPoint?.totalUnits??null;
  if(units!==null)units+=(snapshot.transactions??[]).filter(e=>e.fund===fund&&e.date<=date&&e.date>(unitPoint?.date??"")).reduce((s,e)=>s+e.units,0);
  if(!units||units<=0)reasons.push("deelbewijzen_ontbreken");
  let stocks=0,other=0,cashValue=0,stockMissing=false,otherMissing=false,cashMissing=cash.reasons.length>0;
  const anchor=date===h.anchor;
  for(const position of h.holdings.values()){
    const source=ledger.broker.find(e=>e.fund===fund&&e.kind==="Ankerpositie"&&e.symbol===position.symbol);
    if(anchor&&source?.grossEur!==null&&source?.grossEur!==undefined){if(position.assetClass==="stock")stocks+=source.grossEur;else other+=source.grossEur;continue;}
    const meta=quotes?.historicalInstruments?.find(p=>p.ticker===position.symbol&&p.currency===position.currency)??snapshot.positions.find(p=>p.ticker===position.symbol&&p.currency===position.currency);
    const history=meta?quotes?.history?.[`${meta.exchange}:${meta.ticker.toUpperCase()}`]:undefined;
    const price=history?.filter(p=>p.date<=date).at(-1),fx=fxAt(quotes,position.currency,date);
    const weekday=new Date(date).getUTCDay();
    if(price&&weekday>0&&weekday<6&&price.date!==date)reasons.push("slotkoers_niet_op_waarderingsdatum");
    if(!price||Date.parse(date)-Date.parse(price.date)>4*dayMs||!fx||position.assetClass!=="stock"){
      if(position.assetClass==="stock")stockMissing=true;else otherMissing=true;continue;
    }
    stocks+=position.quantity*price.close/fx;
  }
  for(const [currency,amount] of cash.cash){
    if(anchor){const c=ledger.broker.find(e=>e.fund===fund&&e.kind==="Ankercash"&&e.currency===currency);cashValue+=c?.grossEur??0;}
    else {const fx=fxAt(quotes,currency,date);if(!fx)cashMissing=true;else cashValue+=amount/fx;}
  }
  if(stockMissing)reasons.push("historische_koers_ontbreekt");if(otherMissing)reasons.push("overige_waardering_ontbreekt");if(cashMissing)reasons.push("cashwaardering_onvolledig");
  // Cross-fund receipts/payments require an explicit accounting decision, not automatic netting.
  if(ledger.bank.some(e=>e.fund===fund&&e.kind==="Tussen fondsen"&&e.date<=date&&!approved(e.status)))reasons.push("fondsoverschrijving_te_beoordelen");
  if(ledger.bank.some(e=>e.fund===fund&&e.kind==="Saxo ontbreekt"&&e.date<=date))reasons.push("Saxo_transacties_ontbreken");
  if(ledger.bank.some(e=>e.fund===fund&&e.kind==="Te beoordelen"&&e.date<=date&&!approved(e.status)))reasons.push("bankmutatie_te_beoordelen");
  const anchorApproved=ledger.broker.filter(e=>e.fund===fund&&["Ankerpositie","Ankercash","Ankertotaal"].includes(e.kind)).every(e=>approved(e.status));
  const anchorTotals=ledger.broker.filter(e=>e.fund===fund&&e.kind==="Ankertotaal");
  const anchorParts=ledger.broker.filter(e=>e.fund===fund&&["Ankerpositie","Ankercash"].includes(e.kind)).reduce((sum,e)=>sum+(e.grossEur??0),0);
  if(anchorTotals.length!==1||Math.abs(anchorParts-(anchorTotals[0]?.grossEur??0))>.03)reasons.push("anker_sluit_niet_aan");
  if(!anchorApproved)reasons.push("anker_niet_goedgekeurd");
  const known=ing!==null&&!stockMissing&&!cashMissing&&!otherMissing;
  const fundValue=known?ing+stocks+cashValue+other+transit.value+members.value+settlement.value:null;
  const hardMissing=reasons.some(r=>r!=="anker_niet_goedgekeurd");
  return {fund,date,ing,stocks:stockMissing?null:stocks,brokerCash:cashMissing?null:cashValue,other:otherMissing?null:other,inTransit:transit.value,memberReceivable:members.value,unsettled:settlement.value,units,fundValue,nav:fundValue!==null&&units?fundValue/units:null,status:hardMissing?"incomplete":anchorApproved?"verified":"review",reasons:[...new Set(reasons)]};
}

export function reconstructDays(snapshot:Snapshot,quotes:DailyQuotes|null,through=new Date().toISOString().slice(0,10)):ReconstructionDay[]{
  if(!snapshot.ledger)return [];
  const rows:ReconstructionDay[]=[];
  const memberIssues=new Set(auditLedger(snapshot)?.issues.filter(i=>i.category==="Leden").map(i=>i.fund));
  for(const fund of [1,2,3] as const){
    const control=bankControl(snapshot.ledger,fund);if(!control.from||!control.to)continue;
    const end=through<control.to?through:control.to;
    for(let ms=Date.parse(control.from);ms<=Date.parse(end);ms+=dayMs){const day=valueLedgerDay(snapshot,quotes,fund,new Date(ms).toISOString().slice(0,10));if(memberIssues.has(fund)){day.status="incomplete";day.reasons.push("ledencontrole_sluit_niet_aan");}rows.push(day);}
  }
  return rows;
}
export function verifiedValues(rows:ReconstructionDay[]):FundValuePoint[]{
  return rows.filter(r=>r.status==="verified"&&r.nav!==null&&r.fundValue!==null).map(r=>({fund:r.fund,date:r.date,nav:r.nav!,fundValue:r.fundValue!,coverage:"verified"}));
}

export function historicalCandidates(snapshot:Snapshot):Position[]{
  const map=new Map<string,Position>();
  for(const p of snapshot.positions)map.set(`${p.exchange}:${p.ticker}`,p);
  for(const e of snapshot.ledger?.broker??[]){
    if(!e.symbol||!e.currency||!["Buy","Sell","Ankerpositie"].includes(e.kind))continue;
    const known=snapshot.positions.find(p=>p.ticker===e.symbol&&p.currency===e.currency);
    if(known)map.set(`${known.exchange}:${known.ticker}`,known);
    else if(e.exchange&&approved(e.status)&&e.assetClass!=="bond")map.set(`${e.exchange}:${e.symbol}`,{fund:e.fund,ticker:e.symbol,name:e.description,quantity:0,currency:e.currency,exchange:e.exchange,isin:"",tradingViewSymbol:""});
  }
  return [...map.values()];
}
