import "server-only";
import {createCipheriv,createDecipheriv,createHash,randomBytes} from "node:crypto";
import {parseWorkbook} from "./workbook";
import {getSnapshot,integrationGet,integrationSet,integrationLock,integrationUnlock,pepper,publishPending,recordOperation,savePending} from "./store";
import type {RiskReport} from "./risk-report";
import {patchRiskResults} from "./xlsx-results";

const folderPath="Website invoer";
const masterName="Website invoer - MASTER.xlsx";
const graphRoot="https://graph.microsoft.com/v1.0";
type Credentials={refreshToken:string;accessToken:string;expiresAt:number};
export type DriveConnection={driveId:string;folderId:string;itemId:string;accountId:string;subscriptionId?:string;subscriptionExpires?:string;clientState:string;checkedAt?:string;processedAt?:string;etag?:string;digest?:string;error?:string;resultsAt?:string;resultsVersion?:string;writeError?:string};
export function oneDriveConfigured(){return !!(process.env.ONEDRIVE_CLIENT_ID&&process.env.ONEDRIVE_CLIENT_SECRET&&process.env.MF_SITE_URL);}
export function siteUrl(){const u=new URL(process.env.MF_SITE_URL??"http://127.0.0.1:4186");if(process.env.VERCEL&&u.protocol!=="https:")throw Error("Microsoft-koppeling vereist HTTPS.");return u.origin;}
export const callbackUrl=()=>`${siteUrl()}/api/portal/onedrive/callback`;
const cryptoKey=()=>createHash("sha256").update(`onedrive:${pepper()}`).digest();
function seal(v:Credentials){const iv=randomBytes(12),c=createCipheriv("aes-256-gcm",cryptoKey(),iv),data=Buffer.concat([c.update(JSON.stringify(v)),c.final()]);return [iv,c.getAuthTag(),data].map(b=>b.toString("base64url")).join(".");}
function unseal(s:string):Credentials{const [iv,tag,data]=s.split(".").map(x=>Buffer.from(x,"base64url")),d=createDecipheriv("aes-256-gcm",cryptoKey(),iv);d.setAuthTag(tag);return JSON.parse(Buffer.concat([d.update(data),d.final()]).toString());}
async function exchange(fields:Record<string,string>){
 const res=await fetch("https://login.microsoftonline.com/consumers/oauth2/v2.0/token",{method:"POST",body:new URLSearchParams({...fields,client_id:process.env.ONEDRIVE_CLIENT_ID!,client_secret:process.env.ONEDRIVE_CLIENT_SECRET!,scope:"offline_access Files.ReadWrite"}),signal:AbortSignal.timeout(15000),cache:"no-store"});
 const body=await res.json();if(!res.ok||!body.access_token||!body.refresh_token)throw Error("Microsoft-aanmelding verlopen. Koppel OneDrive opnieuw.");
 const cred:Credentials={accessToken:body.access_token,refreshToken:body.refresh_token,expiresAt:Date.now()+Number(body.expires_in)*1000};await integrationSet("onedrive-token",seal(cred));return cred;
}
async function token(){
 const saved=await integrationGet<string>("onedrive-token");if(!saved)throw Error("OneDrive is nog niet verbonden.");let c=unseal(saved);
 if(c.expiresAt<Date.now()+120000){const lock=await integrationLock("onedrive-token",30);if(!lock)throw Error("Microsoft-koppeling wordt vernieuwd. Probeer later opnieuw.");try{c=unseal((await integrationGet<string>("onedrive-token"))!);if(c.expiresAt<Date.now()+120000)c=await exchange({grant_type:"refresh_token",refresh_token:c.refreshToken});}finally{await integrationUnlock("onedrive-token",lock);}}
 return c.accessToken;
}
async function graph(path:string,init:RequestInit={}){const response=await fetch(`${graphRoot}${path}`,{...init,headers:{...init.headers,Authorization:`Bearer ${await token()}`},signal:AbortSignal.timeout(20000),cache:"no-store"});if(!response.ok)throw Error(`Microsoft-bestandskoppeling: status ${response.status}.`);return response;}
export async function connectDrive(code:string,verifier:string){
 if(!oneDriveConfigured())throw Error("Microsoft-appregistratie ontbreekt.");
 await exchange({grant_type:"authorization_code",code,code_verifier:verifier,redirect_uri:callbackUrl()});
 const drive=await(await graph("/me/drive?$select=id,owner")).json();
 const folder=await(await graph(`/me/drive/root:/${folderPath.split("/").map(encodeURIComponent).join("/")}?$select=id`)).json();
 const item=await(await graph(`/me/drive/items/${folder.id}:/${encodeURIComponent(masterName)}?$select=id,name,size,file`)).json();
 if(!item.file||item.size>2_000_000)throw Error("De gekozen master ontbreekt of is groter dan 2 MB.");
 const previous=await integrationGet<DriveConnection>("onedrive");
 if(previous&&(previous.driveId!==drive.id||previous.itemId!==item.id))throw Error("Er is al een andere master gekoppeld. Ontkoppel eerst via het hoofdbestuur.");
 const c:DriveConnection={...previous,driveId:drive.id,folderId:folder.id,itemId:item.id,accountId:drive.owner?.user?.id??drive.id,clientState:previous?.clientState??randomBytes(32).toString("hex")};
 await integrationSet("onedrive",c);await renewSubscription(c);await integrationSet("onedrive-dirty",true);return syncOneDrive();
}
async function renewSubscription(c:DriveConnection){
 if(c.subscriptionExpires&&Date.parse(c.subscriptionExpires)>Date.now()+2*86400000)return;
 const expirationDateTime=new Date(Date.now()+7*86400000).toISOString();
 if(c.subscriptionId){try{await graph(`/subscriptions/${c.subscriptionId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({expirationDateTime})});c.subscriptionExpires=expirationDateTime;await integrationSet("onedrive",c);return;}catch{/* Recreate an expired subscription. */}}
 const s=await(await graph("/subscriptions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({changeType:"updated",notificationUrl:`${siteUrl()}/api/portal/onedrive/notify`,resource:`me/drive/items/${c.folderId}`,expirationDateTime,clientState:c.clientState})})).json();
 c.subscriptionId=s.id;c.subscriptionExpires=s.expirationDateTime;await integrationSet("onedrive",c);
}
export async function syncOneDrive(){
 const lease=await integrationLock("onedrive-sync",300);if(!lease)return {skipped:true};
 const c=await integrationGet<DriveConnection>("onedrive");if(!c){await integrationUnlock("onedrive-sync",lease);return {skipped:true};}
 try{
  await integrationSet("onedrive-dirty",false);c.checkedAt=new Date().toISOString();
  const path=`/drives/${encodeURIComponent(c.driveId)}/items/${encodeURIComponent(c.itemId)}`;
  const item=await(await graph(`${path}?$select=id,name,eTag,size,file`)).json();
  if(!item.file||item.name!==masterName||item.size>2_000_000)throw Error("Masterbestand ontbreekt, is hernoemd of is te groot.");
  if(item.eTag===c.etag){c.error=undefined;await integrationSet("onedrive",c);await writeResultsLocked(c);return {unchanged:true};}
  const bytes=Buffer.from(await(await graph(`${path}/content`)).arrayBuffer());if(bytes.length>2_000_000)throw Error("Masterbestand is groter dan 2 MB.");
  const after=await(await graph(`${path}?$select=eTag`)).json();if(after.eTag!==item.eTag)throw Error("Excel is tijdens het lezen gewijzigd. Volgende controle leest de nieuwste versie.");
  const previous=await getSnapshot();const snapshot=await parseWorkbook(bytes,pepper(),previous);
  if(snapshot.digest!==previous?.digest)await publishPending(await savePending(snapshot));
  c.etag=item.eTag;c.digest=snapshot.digest;c.processedAt=new Date().toISOString();c.error=undefined;await integrationSet("onedrive",c);
  await integrationSet("onedrive-results-pending",true);await writeResultsLocked(c);
  await recordOperation({kind:"onedrive",cause:"file-change",result:"verwerkt"});return {ok:true};
 }catch(e){c.error=e instanceof Error?e.message:"OneDrive-verwerking mislukt.";await integrationSet("onedrive",c);await integrationSet("onedrive-dirty",true);await recordOperation({kind:"onedrive",cause:"file-change",result:"niet verwerkt",detail:c.error});return {ok:false};}
 finally{await integrationUnlock("onedrive-sync",lease);}
}
export async function maintainOneDrive(){if(!oneDriveConfigured())return;const lease=await integrationLock("onedrive-maintenance",300);if(!lease)return;try{const c=await integrationGet<DriveConnection>("onedrive");if(!c)return;await renewSubscription(c);await syncOneDrive();}finally{await integrationUnlock("onedrive-maintenance",lease);}}
export async function oneDriveStatus(){const c=await integrationGet<DriveConnection>("onedrive");return {configured:oneDriveConfigured(),connected:!!c,checkedAt:c?.checkedAt,processedAt:c?.processedAt,error:c?.error,etag:c?.etag,resultsAt:c?.resultsAt,writeError:c?.writeError,resultsPending:!!await integrationGet("onedrive-results-pending")};}

async function writeResultsLocked(c:DriveConnection){
 if(!await integrationGet("onedrive-results-pending"))return {unchanged:true};
 const snapshot=await getSnapshot();if(!snapshot)return {skipped:true};
 const report=await integrationGet<RiskReport>(`risk:${snapshot.digest}`);if(!report)return {skipped:true};
 let uploadUrl:string|undefined;
 try{
  const path=`/drives/${encodeURIComponent(c.driveId)}/items/${encodeURIComponent(c.itemId)}`;
  const item=await(await graph(`${path}?$select=id,name,eTag,file,size`)).json();
  if(!item.file||item.id!==c.itemId||item.name!==masterName||item.size>2_000_000||!item.eTag)throw Error("Gekoppelde master ontbreekt of is gewijzigd.");
  const bytes=Buffer.from(await(await graph(`${path}/content`)).arrayBuffer());
  const after=await(await graph(`${path}?$select=eTag`)).json();if(after.eTag!==item.eTag)throw Error("Excel wordt bewerkt; resultaten worden later teruggeschreven.");
  const current=await parseWorkbook(bytes,pepper(),snapshot);
  if(current.digest!==report.inputDigest||report.inputDigest!==(await getSnapshot())?.digest)throw Error("Nieuwe invoer wacht nog op verwerking; resultaten worden later teruggeschreven.");
  const output=patchRiskResults(bytes,report);if(output.length>2_000_000)throw Error("Bijgewerkte master is groter dan 2 MB.");
  const session=await(await graph(`${path}/createUploadSession`,{method:"POST",headers:{"Content-Type":"application/json","If-Match":item.eTag},body:JSON.stringify({item:{"@microsoft.graph.conflictBehavior":"replace"},deferCommit:true})})).json();
  const url=new URL(session.uploadUrl);if(url.protocol!=="https:")throw Error("Ongeldige Microsoft-uploadlocatie.");uploadUrl=url.href;
  // Preauthenticated URL: deliberately no Authorization header. No auto-commit.
  const uploaded=await fetch(uploadUrl,{method:"PUT",headers:{"Content-Length":String(output.length),"Content-Range":`bytes 0-${output.length-1}/${output.length}`},body:new Uint8Array(output),signal:AbortSignal.timeout(30000)});
  if(uploaded.status!==202)throw Error(`Microsoft-uitgestelde upload: status ${uploaded.status}.`);
  if((await getSnapshot())?.digest!==report.inputDigest)throw Error("De invoerversie is gewijzigd; resultaten worden later teruggeschreven.");
  // Personal OneDrive supports this explicit commit. If-Match protects the FINAL write,
  // including edits made after session creation and byte upload.
  const committed=await(await graph(path,{method:"PUT",headers:{"Content-Type":"application/json","If-Match":item.eTag},body:JSON.stringify({name:masterName,"@microsoft.graph.conflictBehavior":"replace","@microsoft.graph.sourceUrl":uploadUrl})})).json();
  uploadUrl=undefined;c.etag=committed.eTag;c.resultsVersion=report.version;c.resultsAt=new Date().toISOString();c.writeError=undefined;
  await integrationSet("onedrive",c);
  // A newer quote calculation may have completed during upload. Never lose its pending flag.
  const latestSnapshot=await getSnapshot(),latest=await integrationGet<RiskReport>(`risk:${latestSnapshot?.digest}`);
  await integrationSet("onedrive-results-pending",latestSnapshot?.digest!==report.inputDigest||latest?.version!==report.version);
  await recordOperation({kind:"onedrive-results",cause:"calculation",result:"teruggeschreven"});return {ok:true};
 }catch(e){c.writeError=e instanceof Error?e.message:"Resultaten terugschrijven mislukt.";await integrationSet("onedrive",c);await integrationSet("onedrive-results-pending",true);await recordOperation({kind:"onedrive-results",cause:"calculation",result:"wacht",detail:c.writeError});return {ok:false};}
 finally{if(uploadUrl)await fetch(uploadUrl,{method:"DELETE",signal:AbortSignal.timeout(10000)}).catch(()=>{});}
}
export async function writeOneDriveResults(){
 if(!oneDriveConfigured())return {skipped:true};const lease=await integrationLock("onedrive-sync",300);if(!lease)return {skipped:true};
 try{const c=await integrationGet<DriveConnection>("onedrive");return c?await writeResultsLocked(c):{skipped:true};}finally{await integrationUnlock("onedrive-sync",lease);}
}
