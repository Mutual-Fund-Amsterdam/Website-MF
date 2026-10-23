import {deflateRawSync,inflateRawSync} from "node:zlib";
import type {RiskReport} from "./risk-report";

const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(data:Buffer){let n=0xffffffff;for(const b of data)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
/** Bounded OOXML package patch: preserve every part, change only named result cells. */
export function readPackage(bytes:Buffer):Map<string,Buffer>{
 if(bytes.length>2_000_000)throw Error("Masterbestand is groter dan 2 MB.");
 let eocd=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50&&i+22+bytes.readUInt16LE(i+20)===bytes.length){eocd=i;break;}
 if(eocd<0)throw Error("Ongeldig Excelpakket.");
 const count=bytes.readUInt16LE(eocd+10);let offset=bytes.readUInt32LE(eocd+16),total=0;
 if(count>3000||bytes.readUInt16LE(eocd+4)||bytes.readUInt16LE(eocd+6))throw Error("Excelpakket niet ondersteund.");
 const parts=new Map<string,Buffer>();
 for(let i=0;i<count;i++){
  if(offset+46>bytes.length||bytes.readUInt32LE(offset)!==0x02014b50)throw Error("Ongeldige Excelindex.");
  const flags=bytes.readUInt16LE(offset+8),method=bytes.readUInt16LE(offset+10),crc=bytes.readUInt32LE(offset+16),compressed=bytes.readUInt32LE(offset+20),size=bytes.readUInt32LE(offset+24),nameLength=bytes.readUInt16LE(offset+28),extra=bytes.readUInt16LE(offset+30),comment=bytes.readUInt16LE(offset+32),local=bytes.readUInt32LE(offset+42);
  const name=bytes.subarray(offset+46,offset+46+nameLength).toString("utf8");offset+=46+nameLength+extra+comment;total+=size;
  if(flags&1||![0,8].includes(method)||size>16_000_000||total>48_000_000||parts.has(name)||name.includes("..")||local+30>bytes.length||bytes.readUInt32LE(local)!==0x04034b50)throw Error("Onveilig of te groot Excelpakket.");
  const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);if(start+compressed>bytes.length)throw Error("Onvolledig Excelpakket.");
  const data=method===0?bytes.subarray(start,start+compressed):inflateRawSync(bytes.subarray(start,start+compressed),{maxOutputLength:16_000_000});
  if(data.length!==size||crc32(data)!==crc)throw Error("Beschadigd Excelpakket.");parts.set(name,data);
 }
 return parts;
}
export function writePackage(parts:Map<string,Buffer>):Buffer{
 const localParts:Buffer[]=[],central:Buffer[]=[];let offset=0;
 for(const [name,data] of parts){const file=Buffer.from(name),compressed=deflateRawSync(data),crc=crc32(data),header=Buffer.alloc(30),entry=Buffer.alloc(46);
  header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt32LE(crc,14);header.writeUInt32LE(compressed.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(file.length,26);
  entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x800,8);entry.writeUInt16LE(8,10);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(compressed.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(file.length,28);entry.writeUInt32LE(offset,42);
  localParts.push(header,file,compressed);central.push(entry,file);offset+=header.length+file.length+compressed.length;
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(parts.size,8);end.writeUInt16LE(parts.size,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...localParts,directory,end]);
}
const escape=(s:string)=>s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
function worksheetPath(parts:Map<string,Buffer>,name:string):string{
 const book=parts.get("xl/workbook.xml")?.toString()??"",sheet=[...book.matchAll(/<(?:[A-Za-z_]\w*:)?sheet\b[^>]*>/g)].map(m=>m[0]).find(s=>new RegExp(`name="${escape(name)}"`).test(s)),id=sheet?.match(/\b\w+:id="([^"]+)"/)?.[1];
 const rel=[...(parts.get("xl/_rels/workbook.xml.rels")?.toString()??"").matchAll(/<(?:[A-Za-z_]\w*:)?Relationship\b[^>]*>/g)].map(m=>m[0]).find(r=>r.includes(`Id="${id}"`)),target=rel?.match(/Target="([^"]+)"/)?.[1];
 if(!target||target.includes(".."))throw Error("Tabblad Risico ontbreekt.");return target.startsWith("/")?target.slice(1):`xl/${target}`;
}
export function riskCells(report:RiskReport):Record<string,string|number|null>{
 const localTime=(iso:string|null)=>{if(!iso)return null;const p=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Amsterdam",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date(iso)).map(p=>[p.type,p.value]));return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)/86400000+25569;};
 const cells:Record<string,string|number|null>={D17:localTime(report.quotesAt),D18:localTime(report.calculatedAt)};
 for(const [mode,start] of [["current",6],["historical",13]] as const)for(const fund of [1,2,3] as const){const r=report.funds[fund][mode],row=start+fund-1;Object.assign(cells,{[`B${row}`]:fund,[`C${row}`]:r.volatility,[`D${row}`]:r.sharpe,[`E${row}`]:r.beta,[`F${row}`]:r.maxDrawdown,[`G${row}`]:r.from?Date.parse(r.from)/86400000+25569:null,[`H${row}`]:r.asOf?Date.parse(r.asOf)/86400000+25569:null,[`I${row}`]:r.observations,[`J${row}`]:r.coverage,[`K${row}`]:r.reason??(mode==="historical"&&report.funds[fund].historicalIndicative?"Indicatief":"Bijgewerkt")});}
 return cells;
}
export function patchRiskResults(bytes:Buffer,report:RiskReport):Buffer{
 const parts=readPackage(bytes),path=worksheetPath(parts,"Risico");let xml=parts.get(path)?.toString()??"";
 const prefix=xml.match(/<([A-Za-z_]\w*:)?worksheet\b/)?.[1]??"";
 const marker=xml.match(new RegExp(`<${prefix}c\\b(?=[^>]*\\br="A1")[^>]*>[\\s\\S]*?<\\/${prefix}c>`))?.[0]??"";
 const sharedIndex=marker.includes('t="s"')?Number(marker.match(new RegExp(`<${prefix}v>([0-9]+)<\\/${prefix}v>`))?.[1]):null;
 const shared=sharedIndex!==null&&Number.isSafeInteger(sharedIndex)?[...(parts.get("xl/sharedStrings.xml")?.toString()??"").matchAll(/<(?:[A-Za-z_]\w*:)?si\b[^>]*>[\s\S]*?<\/(?:[A-Za-z_]\w*:)?si>/g)][sharedIndex]?.[0]:null;
 if(!(shared??marker).includes("MF-RISICO-1"))throw Error("Werk eerst de master bij naar de nieuwe Risico-opmaak.");
 for(const [address,value] of Object.entries(riskCells(report))){
  const regex=new RegExp(`<${prefix}c\\b(?=[^>]*\\br="${address}")(?:[^>]*\\/>|[^>]*>[\\s\\S]*?<\\/${prefix}c>)`),found=regex.exec(xml),style=found?.[0].match(/\bs="([^"]+)"/)?.[1];
  const cell=`<${prefix}c r="${address}"${style?` s="${style}"`:""}${typeof value==="string"?' t="inlineStr"':""}>${value===null?"":typeof value==="number"?`<${prefix}v>${Number.isFinite(value)?value:""}</${prefix}v>`:`<${prefix}is><${prefix}t xml:space="preserve">${escape(value)}</${prefix}t></${prefix}is>`}</${prefix}c>`;
  if(found)xml=xml.replace(regex,cell);
  else {const row=address.match(/\d+$/)![0],rowRegex=new RegExp(`(<${prefix}row\\b[^>]*\\br="${row}"[^>]*>)([\\s\\S]*?)(<\\/${prefix}row>)`);if(!rowRegex.test(xml))throw Error("Resultaatrij ontbreekt in Risico.");xml=xml.replace(rowRegex,(_,a,b,c)=>a+b+cell+c);}
 }
 for(const row of [6,7,8,13,14,15,17,18]){
  const re=new RegExp(`(<${prefix}row\\b[^>]*\\br="${row}"[^>]*>)([\\s\\S]*?)(<\\/${prefix}row>)`);
  xml=xml.replace(re,(_,a,b,c)=>{const column=(cell:string)=>cell.match(/\br="([A-Z]+)/)![1].split('').reduce((n,k)=>n*26+k.charCodeAt(0)-64,0);const cells=b.match(new RegExp(`<${prefix}c\\b(?:[^>]*\\/>|[^>]*>[\\s\\S]*?<\\/${prefix}c>)`,"g"))??[];return a+cells.sort((x:string,y:string)=>column(x)-column(y)).join('')+c;});
 }
 // Excel requires cells ordered by column; the template reserves every output cell.
 parts.set(path,Buffer.from(xml));
 // Excel may have recreated the calculation cache since the template was installed.
 // Overwriting a user formula in an output cell must not leave a dangling chain entry.
 if(parts.delete("xl/calcChain.xml")){
  const rels="xl/_rels/workbook.xml.rels",types="[Content_Types].xml";
  parts.set(rels,Buffer.from(parts.get(rels)!.toString().replace(/<(?:[A-Za-z_]\w*:)?Relationship\b(?=[^>]*\bType="[^"]*\/calcChain")[^>]*\/>/g,"")));
  parts.set(types,Buffer.from(parts.get(types)!.toString().replace(/<(?:[A-Za-z_]\w*:)?Override\b(?=[^>]*\bPartName="\/xl\/calcChain\.xml")[^>]*\/>/g,"")));
 }
 return writePackage(parts);
}
