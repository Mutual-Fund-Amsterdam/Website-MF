import assert from 'node:assert/strict';
import {patchRiskResults,readPackage,writePackage,riskCells} from '../lib/portal/xlsx-results.ts';
const metric={asOf:'2026-10-22',from:'2025-10-22',observations:250,coverage:1,reason:null,beta:.8,sharpe:1.1,volatility:.15,maxDrawdown:-.2};
const report={version:'fixture',inputDigest:'fixture',quotesAt:'2026-10-23T05:15:00Z',calculatedAt:'2026-10-23T06:00:00Z',funds:Object.fromEntries([1,2,3].map(f=>[f,{current:metric,historical:metric,historicalIndicative:false}]))};
const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
for(const prefix of ['','x:'])for(const shared of [false,true]){
 const rowMap=new Map(),marker=shared?`<${prefix}c r="A1" t="s"><${prefix}v>0</${prefix}v></${prefix}c>`:`<${prefix}c r="A1" t="inlineStr"><${prefix}is><${prefix}t>MF-RISICO-1</${prefix}t></${prefix}is></${prefix}c>`;rowMap.set(1,[marker]);
 for(const address of Object.keys(riskCells(report))){const row=Number(address.match(/\d+/)[0]);if(!rowMap.has(row))rowMap.set(row,[]);rowMap.get(row).push(`<${prefix}c r="${address}" s="0"/>`);}
 const xml=`<${prefix}worksheet xmlns${prefix?':x':''}="${ns}"><${prefix}sheetData>${[...rowMap].sort(([a],[b])=>a-b).map(([r,c])=>`<${prefix}row r="${r}">${c.join('')}</${prefix}row>`).join('')}</${prefix}sheetData></${prefix}worksheet>`;
 const parts=new Map([
  ['xl/workbook.xml',Buffer.from(`<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Risico" sheetId="1" r:id="risk"/></sheets></workbook>`)],
  ['xl/_rels/workbook.xml.rels',Buffer.from('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="risk" Target="worksheets/sheet1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"/><Relationship Id="chain" Target="calcChain.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/calcChain"/></Relationships>')],
  ['[Content_Types].xml',Buffer.from('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/xl/calcChain.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.calcChain+xml"/></Types>')],
  ['xl/calcChain.xml',Buffer.from(`<calcChain xmlns="${ns}"><c i="1" r="E6"/></calcChain>`)],
  ['xl/worksheets/sheet1.xml',Buffer.from(xml)],
  ['xl/worksheets/input.xml',Buffer.from('<fixture>unchanged input and formula</fixture>')],
 ]);
 if(shared)parts.set('xl/sharedStrings.xml',Buffer.from(`<sst xmlns="${ns}"><si><t>MF-RISICO-1</t></si></sst>`));
 const output=readPackage(patchRiskResults(writePackage(parts),report));
 assert.equal(output.has('xl/calcChain.xml'),false);assert.ok(!output.get('xl/_rels/workbook.xml.rels').toString().includes('/calcChain'));assert.ok(!output.get('[Content_Types].xml').toString().includes('calcChain.xml'));
 assert.ok(output.get('xl/worksheets/sheet1.xml').toString().includes('>0.8<'));assert.deepEqual(output.get('xl/worksheets/input.xml'),parts.get('xl/worksheets/input.xml'));
 assert.deepEqual(output.get('xl/workbook.xml'),parts.get('xl/workbook.xml'));
}
assert.throws(()=>readPackage(Buffer.from('not a zip')),/Excelpakket/);
console.log('XLSX results: default/prefixed namespaces, inline/shared markers, numeric risk output, calcChain plus relationship/type invalidation, input preservation and malformed package rejection passed.');
