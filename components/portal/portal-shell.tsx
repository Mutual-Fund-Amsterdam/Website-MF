import Link from "next/link";
import type { ReactNode } from "react";
import "./platinum.css";

export default function PortalShell({ children }: { children: ReactNode }) {
  return <div className="mf-platinum">
    <header className="mf-mast"><div>
      <Link className="mf-wordmark" href="/mijn-fonds">Mutual Fund<span>.</span></Link>
      <div className="mf-mast-links"><Link href="/">Naar de website</Link></div>
    </div></header>
    {children}
  </div>;
}
