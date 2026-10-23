import {NextResponse,after} from "next/server";
import {cookies} from "next/headers";
import {getMemberSession,integrationGet,integrationDelete,integrationSet,recordOperation} from "@/lib/portal/store";
import {connectDrive,siteUrl} from "@/lib/portal/onedrive";
export const runtime="nodejs";
export const maxDuration=300;
export async function GET(req:Request){
 const url=new URL(req.url),state=url.searchParams.get("state")??"",jar=await cookies(),s=await getMemberSession();
 if(!/^[\w-]{43}$/.test(state)||jar.get("mf_onedrive_state")?.value!==state||s?.member.role!=="Hoofdbestuurder")return NextResponse.json({error:"Ongeldige Microsoft-aanmelding."},{status:403});
 const saved=await integrationGet<{verifier:string;member:string}>(`oauth:${state}`);if(!saved||saved.member!==s.member.key)return NextResponse.json({error:"Aanmelding verlopen."},{status:403});
 await integrationDelete(`oauth:${state}`);jar.delete("mf_onedrive_state");
 const code=url.searchParams.get("code");if(!code)return NextResponse.redirect(`${siteUrl()}/beheer/koppelingen?microsoft=afgebroken`);
 await integrationSet("onedrive-connect-status","Microsoft-koppeling wordt gecontroleerd.");
 after(async()=>{try{await connectDrive(code,saved.verifier);await integrationSet("onedrive-connect-status","Verbonden. Controleer hieronder de laatste verwerking.");}catch(e){await integrationSet("onedrive-connect-status",e instanceof Error?e.message:"Koppeling mislukt.");await recordOperation({kind:"onedrive",cause:"connect",result:"koppeling mislukt"});}});
 return NextResponse.redirect(`${siteUrl()}/beheer/koppelingen?microsoft=controleren`);
}
