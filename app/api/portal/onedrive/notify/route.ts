import {NextResponse,after} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {integrationGet,integrationSet} from "@/lib/portal/store";
import {syncOneDrive,type DriveConnection} from "@/lib/portal/onedrive";
export const runtime="nodejs";
export const maxDuration=300;
export async function POST(req:Request){
 const challenge=new URL(req.url).searchParams.get("validationToken");
 if(challenge&&challenge.length<=4096)return new Response(challenge,{headers:{"Content-Type":"text/plain","Cache-Control":"no-store"}});
 const c=await integrationGet<DriveConnection>("onedrive");if(!c)return NextResponse.json({error:"Geen koppeling."},{status:404});
 const body=await req.json().catch(()=>null);if(!Array.isArray(body?.value)||body.value.length>100)return NextResponse.json({error:"Ongeldige melding."},{status:400});
 const valid=body.value.some((v:{subscriptionId?:unknown;clientState?:unknown})=>{if(v.subscriptionId!==c.subscriptionId||typeof v.clientState!=="string")return false;const a=Buffer.from(v.clientState),b=Buffer.from(c.clientState);return a.length===b.length&&timingSafeEqual(a,b);});
 if(!valid)return NextResponse.json({error:"Geen toegang."},{status:403});
 await integrationSet("onedrive-dirty",true);after(async()=>{for(let i=0;i<3&&await integrationGet("onedrive-dirty");i++){const result=await syncOneDrive();if("skipped" in result||"ok" in result&&!result.ok)break;}});
 return new Response(null,{status:202});
}
