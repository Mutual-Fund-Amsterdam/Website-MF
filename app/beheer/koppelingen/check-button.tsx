"use client";
import {useState} from "react";
export default function CheckButton(){const [message,setMessage]=useState("");return <><button type="button" className="btn btn-secondary" onClick={async()=>{setMessage("Bezig…");try{const r=await fetch("/api/portal/onedrive/check",{method:"POST"});setMessage(r.ok?"Controle gestart. Vernieuw deze pagina voor de uitkomst.":"Controle kon niet starten.");}catch{setMessage("Controle kon niet starten.");}}}>Bestand controleren</button><p role="status">{message}</p></>;}
