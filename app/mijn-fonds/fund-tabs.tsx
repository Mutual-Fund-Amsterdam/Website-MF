import Link from 'next/link';
import type {Member} from '@/lib/portal/types';
import {canCompareFunds} from '@/lib/portal/fund-comparison';
import styles from './page.module.css';

export default function FundTabs({member,active}:{member:Member;active:number|'comparison'}){
 const comparison=canCompareFunds(member);
 if(member.allowedFunds.length<2&&!comparison)return null;
 return <nav className={styles.switcher} aria-label="Kies fonds">
  {member.allowedFunds.map(fund=><Link key={fund} href={`/mijn-fonds?fonds=${fund}`} aria-current={active===fund?'page':undefined}>Fonds {fund}</Link>)}
  {comparison&&<Link href="/mijn-fonds/vergelijking" aria-current={active==='comparison'?'page':undefined}>Vergelijking</Link>}
 </nav>;
}
