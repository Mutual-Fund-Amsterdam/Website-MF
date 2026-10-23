import {createHash} from "node:crypto";
import type {DailyQuotes,FundNumber,FundValuePoint,Snapshot} from "./types";
import {estimatedFundHistory} from "./estimated-history";
import {currentPortfolioRisk,historicalDailyRisk,type DetailedRisk} from "./current-risk";
export type FundRisk={current:DetailedRisk;historical:DetailedRisk;historicalIndicative:boolean};
export type RiskReport={version:string;inputDigest:string;quotesAt:string|null;calculatedAt:string;funds:Record<FundNumber,FundRisk>};
export function calculateRiskReport(snapshot:Snapshot,quotes:DailyQuotes|null,daily:FundValuePoint[]=[]):RiskReport{
 const funds={} as Record<FundNumber,FundRisk>;
 for(const f of [1,2,3] as const){
  const verified=daily.filter(p=>p.fund===f&&p.coverage==="verified").sort((a,b)=>a.date.localeCompare(b.date));
  const realised=historicalDailyRisk(verified,quotes),indicative=realised.volatility===null;
  funds[f]={current:currentPortfolioRisk(snapshot,quotes,f),historical:indicative?historicalDailyRisk(estimatedFundHistory(snapshot,quotes,f),quotes):realised,historicalIndicative:indicative};
 }
 const version=createHash("sha256").update(JSON.stringify({method:"risk-1",input:snapshot.digest,quotes,funds})).digest("hex");
 return {version,inputDigest:snapshot.digest,quotesAt:quotes?.fetchedAt??null,calculatedAt:new Date().toISOString(),funds};
}
