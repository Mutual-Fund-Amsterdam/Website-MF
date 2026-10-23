import { NextResponse } from "next/server";
import { allowAttempt, getMemberSession, sameOrigin, saveFeedback } from "@/lib/portal/store";
export const runtime="nodejs";
export async function POST(request:Request){
 const headers={"Cache-Control":"no-store"};
 if(!sameOrigin(request))return NextResponse.json({error:"Ongeldige aanvraag."},{status:403,headers});
 const session=await getMemberSession();
 if(!session)return NextResponse.json({error:"Log eerst in."},{status:401,headers});
 if(Number(request.headers.get("content-length")??0)>16000)return NextResponse.json({error:"Feedback is te lang."},{status:413,headers});
 if(!await allowAttempt(request,"feedback"))return NextResponse.json({error:"Probeer het later opnieuw."},{status:429,headers});
 try{
   const body=await request.json();const fund=Number(body.fund);
   if((fund!==1&&fund!==2&&fund!==3)||!session.member.allowedFunds.includes(fund)||typeof body.text!=="string"||!body.text.trim()||body.text.length>3000)return NextResponse.json({error:"Vul maximaal 3000 tekens in voor je eigen fonds."},{status:400,headers});
   await saveFeedback(session.member,fund,body.text);
   return NextResponse.json({ok:true},{headers});
 }catch{return NextResponse.json({error:"Opslaan is niet gelukt."},{status:503,headers});}
}
