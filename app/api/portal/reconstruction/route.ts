import {NextResponse} from "next/server";
import {getMemberSession,getReconstructionDays} from "@/lib/portal/store";
export const runtime="nodejs";
export async function GET(request:Request){
 const headers={"Cache-Control":"no-store"};
 const session=await getMemberSession();
 if(!session||session.member.role.toLowerCase()!=="hoofdbestuurder")return NextResponse.json({error:"Geen toegang."},{status:403,headers});
 const f=Number(new URL(request.url).searchParams.get("fonds"));
 if(f!==1&&f!==2&&f!==3)return NextResponse.json({error:"Ongeldig fonds."},{status:400,headers});
 const rows=await getReconstructionDays(session.snapshot,f);
 const columns=["date","fund","ing","stocks","brokerCash","other","inTransit","memberReceivable","unsettled","units","fundValue","nav","status","reasons"] as const;
 const csv=[columns.join(";"),...rows.map(r=>columns.map(k=>`"${String(Array.isArray(r[k])?r[k].join(" | "):r[k]??"").replaceAll('"','""')}"`).join(";"))].join("\r\n");
 return new Response("\ufeff"+csv,{headers:{...headers,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="reconstructie-fonds-${f}.csv"`}});
}
