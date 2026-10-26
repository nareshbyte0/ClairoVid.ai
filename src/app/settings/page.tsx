import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth/server";
import { SignOut } from "@/components/sign-out";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const user = (await auth.api.getSession({ headers: await headers() }))?.user;
  if (!user) redirect("/sign-in");

  return <main className="workspace">
    <aside className="sidebar">
      <BrandLogo href="/dashboard" label="ClairoVid.ai — My videos"/>
      <div className="sideLabel">YOUR WORKSPACE</div>
      <nav className="sideNav" aria-label="Your workspace">
        <Link className="sideItem" href="/dashboard"><span aria-hidden="true">▦</span> My videos</Link>
        <Link className="sideItem selected" href="/settings" aria-current="page"><span aria-hidden="true">⚙</span> Settings</Link>
      </nav>
      <div className="sideBottom">
        <div className="userBadge">{user.name?.slice(0, 1).toUpperCase() || "C"}</div>
        <div className="userName">{user.name}<small>{user.email}</small></div>
        <SignOut />
      </div>
    </aside>
    <section className="dashMain">
      <div className="dashTop"><div><div className="eyebrow">YOUR ACCOUNT</div><h1>Settings</h1><p>Personal details and connected services.</p></div></div>
      <div className="settingsCard">
        <div className="settingRow"><div><b>Account</b><small>{user.email}</small></div><span className="statusTag">{user.emailVerified ? "VERIFIED" : "VERIFY EMAIL"}</span></div>
        <div className="settingRow"><div><b>Instagram publishing</b><small>Connect your own Instagram account to publish approved videos.</small></div><button className="secondaryButton" disabled title="Meta app configuration and review are required">Unavailable</button></div>
        <div className="settingRow"><div><b>Voice presets</b><small>Choose from the configured Indian English male and female voices when creating a project.</small></div><Link href="/dashboard" className="textLink">View projects ↗</Link></div>
        <div className="settingsFooter"><Link href="/dashboard" className="secondaryButton">Back to my videos</Link></div>
      </div>
    </section>
  </main>;
}
