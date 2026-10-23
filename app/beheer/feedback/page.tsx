import Link from "next/link";
import {redirect} from "next/navigation";
import {getFeedback,getMemberSession} from "@/lib/portal/store";
import styles from "../import/page.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Feedback",robots:{index:false,follow:false}};
export default async function FeedbackPage(){
 const session=await getMemberSession();if(!session)redirect('/inloggen');
 if(session.member.role.toLowerCase()!=="hoofdbestuurder")redirect('/mijn-fonds');
 const feedback=await getFeedback(session.member);
 return <main id="main-content" className={`page-shell ${styles.main}`}><div className="container"><p className="eyebrow">Bestuur / ledenomgeving</p><h1>Feedback.</h1><nav><Link href="/beheer/import">Excel importeren</Link> · <Link href="/beheer/feedback" aria-current="page">Feedback</Link></nav>{!feedback.length&&<p>Nog geen feedback ontvangen.</p>}{feedback.map(row=><article key={row.id} className={styles.panel}><p>Fonds {row.fund} · {row.name} ({row.memberId}) · {new Intl.DateTimeFormat('nl-NL',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Amsterdam'}).format(new Date(row.createdAt))}</p><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{row.text}</p></article>)}<p><Link href="/mijn-fonds">← Terug naar mijn fonds</Link></p></div></main>;
}
