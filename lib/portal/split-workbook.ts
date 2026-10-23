import type {InputCell,InputSheet} from "./input-workbook";

type Row=Record<string,InputCell|undefined>;
const text=(v:InputCell|undefined)=>String(v??"").trim();
export const INPUT_CURRENCIES=["EUR","USD","CAD","GBP","CHF","DKK","SEK","NOK","PLN","CZK","HUF","JPY","AUD","NZD","HKD","SGD","CNY","INR","KRW","ZAR","BRL","MXN","TRY","ILS","IDR","MYR","PHP","THB","RON","ISK"];
export function isSplitWorkbook(sheets:InputSheet[]){return sheets.some(s=>s.sheet==="Uitleg"&&s.data[0]?.[1]==="MF-WEBSITE-3");}
function read(sheets:InputSheet[],name:string,key:string):Row[]{
 const sheet=sheets.find(s=>s.sheet===name);if(!sheet)throw Error(`Tabblad ${name} ontbreekt.`);
 const start=sheet.data.findIndex(r=>r.some(c=>text(c)===key));if(start<0)throw Error(`Kolom ${key} ontbreekt op ${name}.`);
 const headers=sheet.data[start].map(text),rows:Row[]=[];
 for(let i=start+1;i<sheet.data.length;i++){
  if(!sheet.data[i].some(c=>text(c)))break;
  const row=Object.fromEntries(headers.map((h,c)=>[h,sheet.data[i][c]]));
  // Formula-only lookup cells and reserved internal IDs do not constitute input.
  const computed=name==="Toegang"?["Naam","Fonds"]:name==="Aan- en verkopen"?["Aandeel","Valuta","Cashmutatie"]:[];
  if(!headers.some(h=>h&&!["Invoer-ID",...computed].includes(h)&&text(row[h])))continue;
  row.__row=i+1;rows.push(row);
 }
 return rows;
}

export function splitCatalog(sheets:InputSheet[]):Row[]{
 const venues:Record<string,[string,string]>={"Euronext Amsterdam":["XAMS","EURONEXT"],"Euronext Paris":["XPAR","EURONEXT"],Nasdaq:["XNAS","NASDAQ"],"New York Stock Exchange":["XNYS","NYSE"],"NYSE American":["XASE","AMEX"],"Toronto Stock Exchange":["XTSE","TSX"],"Vienna Stock Exchange":["XWBO","VIE"]};
 return read(sheets,"Aandelen","Ticker").map(a=>{const v=venues[text(a.Beurs)],ticker=text(a.Ticker).toUpperCase();return {...a,Koerscode:text(a.Koerscode)||(v?`${ticker}.${v[0]}`:""),"TradingView-code":text(a["TradingView-code"])||(v?`${v[1]}:${ticker}`:"")};});
}

/** The visible workbook is a simple set of tables; the dated replay remains shared with v2. */
export function splitInputSheet(sheets:InputSheet[]):InputSheet|null{
 if(!isSplitWorkbook(sheets))return null;
 const cover=sheets.find(s=>s.sheet==="Uitleg")!,members=read(sheets,"Leden","Lid-ID"),access=read(sheets,"Toegang","Lid-ID"),catalog=splitCatalog(sheets);
 const ids=new Set<string>(),accessById=new Map<string,Row>(),instruments=new Map<string,Row>();
 for(const a of access){const id=text(a["Lid-ID"]);if(!id||accessById.has(id))throw Error(`Lid-ID ontbreekt of komt dubbel voor op Toegang rij ${a.__row}.`);accessById.set(id,a);}
 for(const a of catalog){const ticker=text(a.Ticker).toUpperCase();if(!ticker||instruments.has(ticker))throw Error(`Ticker ontbreekt of komt dubbel voor op Aandelen rij ${a.__row}.`);if(!INPUT_CURRENCIES.includes(text(a.Valuta)))throw Error(`Valuta ontbreekt of is ongeldig bij ${ticker}.`);for(const k of ["Aandeel","Beurs","Koerscode","TradingView-code","Sector"])if(!text(a[k]))throw Error(`Vul ${k} in bij ${ticker} op Aandelen.`);instruments.set(ticker,a);}
 const combined=members.map(m=>{
  const id=text(m["Lid-ID"]);if(!id||ids.has(id))throw Error(`Lid-ID ontbreekt of komt dubbel voor op Leden rij ${m.__row}.`);ids.add(id);
  const a=accessById.get(id);if(!a)throw Error(`Vul de toegang in voor lid ${id}.`);
  return {...m,...a,Naam:m.Naam,Fonds:m.Fonds,Status:m.Status,"Invoer-ID":m["Invoer-ID"],"Toegang fondsen":text(a["Toegang fondsen"])||m.Fonds};
 });
 for(const id of accessById.keys())if(!ids.has(id))throw Error(`Lid ${id} staat op Toegang maar ontbreekt op Leden.`);
 const trades=read(sheets,"Aan- en verkopen","Handeling").map(r=>{
  const a=instruments.get(text(r.Ticker).toUpperCase());if(!a)throw Error(`Voeg ${text(r.Ticker)||"het aandeel"} eerst toe op Aandelen (transactierij ${r.__row}).`);
  return {...a,...r,Valuta:a.Valuta,Beurs:a.Beurs,Aandeel:a.Aandeel,ISIN:a.ISIN,Koerscode:a.Koerscode,"TradingView-code":a["TradingView-code"],Sector:a.Sector};
 });
 const sections:Record<string,Row[]>={LEDEN:combined,AANDELEN:trades,LEDENMUTATIES:read(sheets,"Ledenmutaties","Handeling"),SALDI:read(sheets,"Cash","Rekening")};
 const data:InputCell[][]=[["Versie","MF-INVOER-2"],[],["Basisdatum",cover.data[2]?.[1]??null]];
 for(const [section,rows]of Object.entries(sections)){
  const headers=["Invoer-ID","Verwerking",...new Set(rows.flatMap(r=>Object.keys(r)).filter(k=>!["Invoer-ID","Verwerking","__row"].includes(k)))];
  // Empty sections still have valid headers and can be replayed.
  data.push([`#${section}`],headers,...rows.map(r=>headers.map(k=>k==="Verwerking"?"Klaar":r[k]??null)));
 }
 return {sheet:"Invoer",data};
}
