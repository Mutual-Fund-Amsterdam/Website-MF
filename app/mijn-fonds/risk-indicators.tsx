import type {DetailedRisk} from "@/lib/portal/current-risk";
import type {FundRisk} from "@/lib/portal/risk-report";
import styles from "./page.module.css";
const pct=(n:number)=>`${(n*100).toLocaleString("nl-NL",{maximumFractionDigits:1})}%`;
function Block({title,risk,indicative=false}:{title:string;risk:DetailedRisk;indicative?:boolean}){
 return <div style={{marginTop:24}}><h3>{title}</h3><p className={styles.muted}>12 maanden{indicative?" · indicatief":""}{risk.asOf?` · t/m ${new Date(risk.asOf+"T12:00:00Z").toLocaleDateString("nl-NL")}`:""}</p><div className={styles.riskGrid}>{[["Sharpe",risk.sharpe,false],["Beta S&P 500",risk.beta,false],["Volatiliteit",risk.volatility,true],["Maximale daling",risk.maxDrawdown,true]].map(([name,value,percent])=><div key={String(name)}><span>{name}</span><strong>{typeof value==="number"?(percent?pct(value):value.toLocaleString("nl-NL",{maximumFractionDigits:2})):"—"}</strong></div>)}</div>{risk.reason&&<p className={styles.muted}>{risk.reason}{risk.coverage<1?` Historiedekking: ${pct(risk.coverage)}.`:""}</p>}</div>;
}
export default function RiskIndicators({risk}:{risk:FundRisk}){
 return <><Block title="Huidige portefeuille — model" risk={risk.current}/><Block title="Historisch fonds" risk={risk.historical} indicative={risk.historicalIndicative}/></>;
}
