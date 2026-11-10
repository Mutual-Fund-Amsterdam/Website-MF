import type {Snapshot,DailyQuotes,FundNumber,FundHistoryPoint} from './types';
import {cashReviewIssues} from './cash-review';
import {portfolioView} from './portfolio';
import {currentBookIssues} from './current-fund-history';
export type BookPoint=FundHistoryPoint&{fundValue:number;quoteDate:string};
/** Same priced assets, cash, liabilities and unit ledger for every member. No I/O. */
export function currentBookPoint(snapshot:Snapshot,quotes:DailyQuotes|null,fund:FundNumber,asOf=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam'}).format(new Date())):BookPoint|null{
 if(!snapshot.unitLedger||!quotes)return null;
 if(currentBookIssues(snapshot,fund).length||cashReviewIssues(snapshot,fund).length)return null;
 const cash=snapshot.cash.find(c=>c.fund===fund),positions=snapshot.positions.filter(p=>p.fund===fund);
 const view=portfolioView(positions,cash,quotes),totalUnits=snapshot.totalUnitsByFund?.[fund];
 if(view.fundValue===null||view.fundValue<=0||!totalUnits||totalUnits<=0||!positions.length)return null;
 const quoteDates=view.valued.map(p=>p.quote?.date);
 if(quoteDates.some(d=>!d))return null;
 const quoteDate=(quoteDates as string[]).sort()[0];
 const basis=[quoteDate,snapshot.unitLedger.asOf[fund],cash?.ingAsOf,cash?.brokerAsOf,cash?.otherAsOf,cash?.payablesAsOf].filter((d):d is string=>!!d).sort().at(-1)!;
 if(basis>asOf)return null;
 const date=asOf;
 return {fund,date,quoteDate,totalUnits,fundValue:view.fundValue,nav:view.fundValue/totalUnits};
}
