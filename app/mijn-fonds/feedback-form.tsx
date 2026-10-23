"use client";
import {useState} from "react";
import styles from "./page.module.css";
export default function FeedbackForm({fund}:{fund:number}){
 const [open,setOpen]=useState(false),[text,setText]=useState(""),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 return <div className={styles.feedback}><button className={styles.beastButton} onClick={()=>setOpen(!open)} aria-expanded={open}>Feedback geven</button>{open&&<form onSubmit={async e=>{e.preventDefault();setBusy(true);try{const r=await fetch('/api/portal/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fund,text})});const data=await r.json();if(!r.ok)throw new Error(data.error);setText("");setStatus("Bedankt, je feedback is ontvangen.");}catch(e){setStatus(e instanceof Error?e.message:"Opslaan is niet gelukt.");}finally{setBusy(false);}}}><label htmlFor="fund-feedback">Je feedback over fonds {fund}</label><textarea id="fund-feedback" value={text} onChange={e=>setText(e.target.value)} required maxLength={3000} rows={4}/><button className={styles.beastButton} disabled={busy||!text.trim()}>{busy?"Versturen…":"Versturen"}</button><p role="status">{status}</p></form>}</div>;
}
