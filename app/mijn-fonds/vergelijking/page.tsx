import {redirect} from 'next/navigation';
import {getDailyQuotes,getMemberSession,getFundDailyValues} from '@/lib/portal/store';
import {chartNav} from '@/lib/portal/chart-nav';
import {canCompareFunds,comparisonCalendar,COMPARISON_FUNDS,type ComparisonNav} from '@/lib/portal/fund-comparison';
import FundTabs from '../fund-tabs';
import LogoutButton from '../logout-button';
import FundComparisonChart from './chart';
import styles from '../page.module.css';

export const dynamic='force-dynamic';
export const metadata={title:'Fondsvergelijking',robots:{index:false,follow:false}};

export default async function FundComparisonPage(){
 const session=await getMemberSession();
 if(!session)redirect('/inloggen');
 // Authorize before loading or calculating any cross-fund data.
 if(!canCompareFunds(session.member))redirect('/mijn-fonds');
 const [quotes,daily]=await Promise.all([getDailyQuotes(),getFundDailyValues()]);
 const asOf=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam'}).format(new Date());
 const histories={} as Record<1|2|3,ComparisonNav[]>;
 for(const fund of COMPARISON_FUNDS){
  histories[fund]=chartNav(session.snapshot,quotes,fund,daily);
 }
 const comparison=comparisonCalendar(histories,asOf);
 return <main id="main-content" className={`page-shell ${styles.main}`}><div className="container">
  <div className={styles.top}><p className="eyebrow">Ledenomgeving / hoofdbestuur</p><LogoutButton/></div>
  <FundTabs member={session.member} active="comparison"/>
  <FundComparisonChart {...comparison} asOf={asOf}/>
 </div></main>;
}
