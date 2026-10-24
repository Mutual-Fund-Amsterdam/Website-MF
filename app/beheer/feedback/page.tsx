import BoardNav from "../board-nav";
import {redirect} from "next/navigation";
import {getFeedback,getMemberSession} from "@/lib/portal/store";
import styles from "../import/page.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Feedback",robots:{index:false,follow:false}};
export default async function FeedbackPage(){
 const session=await getMemberSession();if(!session)redirect('/inloggen');
 if(session.member.role.toLowerCase()!=="hoofdbestuurder")redirect('/mijn-fonds');
 const feedback=await getFeedback(session.member);
 return <main id="main-content" className={`page-shell ${styles.main}`}><div className="container"><p className="eyebrow">Bestuur / ledenomgeving</p><h1>Feedback van leden.</h1><BoardNav active="feedback"/><p className={styles.intro}>{feedback.length} {feedback.length===1?"bericht":"berichten"} ontvangen · nieuwste eerst</p>{!feedback.length&&<p>Nog geen feedback ontvangen.</p>}{feedback.map(row=><article key={row.id} className={styles.panel}><h2>{row.name}</h2><p className={styles.intro}>Lid-ID: {row.memberId} · Fonds {row.fund}<br/><time dateTime={row.createdAt}>{new Intl.DateTimeFormat('nl-NL',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Amsterdam'}).format(new Date(row.createdAt))}</time></p><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{row.text}</p></article>)}<p><a href="/mijn-fonds">← Terug naar mijn fonds</a></p></div></main>;
}
