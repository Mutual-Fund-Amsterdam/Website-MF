import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {createHash,randomBytes} from "node:crypto";
import {getMemberSession,integrationSet} from "@/lib/portal/store";
import {callbackUrl,oneDriveConfigured} from "@/lib/portal/onedrive";
export const runtime="nodejs";
export async function GET(){
 const s=await getMemberSession();if(s?.member.role!=="Hoofdbestuurder")return NextResponse.json({error:"Geen toegang."},{status:403});
 if(!oneDriveConfigured())return NextResponse.json({error:"De Microsoft-appregistratie is nog niet ingesteld."},{status:503});
 const state=randomBytes(32).toString("base64url"),verifier=randomBytes(48).toString("base64url");
 await integrationSet(`oauth:${state}`,{verifier,member:s.member.key},600);
 (await cookies()).set("mf_onedrive_state",state,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:600});
 const u=new URL("https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize");u.search=new URLSearchParams({client_id:process.env.ONEDRIVE_CLIENT_ID!,response_type:"code",redirect_uri:callbackUrl(),response_mode:"query",scope:"offline_access Files.ReadWrite",login_hint:"voorzitter@mutualfund.nl",state,code_challenge:createHash("sha256").update(verifier).digest("base64url"),code_challenge_method:"S256",prompt:"select_account"}).toString();
 return NextResponse.redirect(u);
}
