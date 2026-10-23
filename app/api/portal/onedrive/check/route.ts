import {NextResponse,after} from "next/server";
import {getMemberSession,sameOrigin} from "@/lib/portal/store";
import {maintainOneDrive} from "@/lib/portal/onedrive";
export const runtime="nodejs";export const maxDuration=300;
export async function POST(req:Request){if(!sameOrigin(req)||(await getMemberSession())?.member.role!=="Hoofdbestuurder")return NextResponse.json({error:"Geen toegang."},{status:403});after(async()=>{await maintainOneDrive();});return NextResponse.json({ok:true});}
