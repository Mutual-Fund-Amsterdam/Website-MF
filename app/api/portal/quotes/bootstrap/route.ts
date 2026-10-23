import {NextResponse} from "next/server";
export async function POST(){return NextResponse.json({error:"De losse koersimport is uitgeschakeld. Koersen worden uitsluitend door de dagelijkse taak opgehaald."},{status:410,headers:{"Cache-Control":"no-store"}});}
