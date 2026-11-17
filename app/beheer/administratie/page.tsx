import { redirect } from "next/navigation";
import { administrationEnabled, mfaStatus, requireIdentity } from "@/lib/portal/admin/access";
import AdministrationClient from "./administration";
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";
export const metadata = { title: "Bestuursadministratie", robots: { index: false, follow: false } };
export default async function AdministrationPage() {
  if (!administrationEnabled()) return <main id="main-content"><h1>Bestuursadministratie</h1><p>De bestuursomgeving wordt ingericht.</p></main>;
  let identity;
  try { identity = await requireIdentity(); } catch { redirect("/inloggen"); }
  const status = await mfaStatus(identity);
  return <AdministrationClient enrolled={status.enrolled} verified={status.verified} local={process.env.MF_LOCAL_PREVIEW === "1" && !process.env.VERCEL} />;
}
