"use client";
import { useRouter } from "next/navigation";
export default function LogoutButton() {
  const router = useRouter();
  return <button className="button" type="button" onClick={async () => { await fetch("/api/portal/logout", { method: "POST" }); router.push("/inloggen"); router.refresh(); }}>Uitloggen</button>;
}
