import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth/server";
import { listProjects } from "@/domain/project";
import { ProjectLibrary } from "@/components/project-library";
import { SignOut } from "@/components/sign-out";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";
export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  const projects = await listProjects(session.user.id);
  return <main className="workspace">
    <aside className="sidebar">
      <BrandLogo href="/dashboard" label="ClairoVid.ai — My videos"/>
      <div className="sideLabel">YOUR WORKSPACE</div>
      <nav className="sideNav" aria-label="Your workspace">
        <Link className="sideItem selected" href="/dashboard" aria-current="page"><span aria-hidden="true">▦</span> My videos</Link>
        <Link className="sideItem" href="/settings"><span aria-hidden="true">⚙</span> Settings</Link>
      </nav>
      <div className="sideBottom"><div className="userBadge">{session.user.name?.slice(0, 1).toUpperCase() || "C"}</div><div className="userName">{session.user.name}<small>{session.user.email}</small></div><SignOut/></div>
    </aside>
    <section className="dashMain">
      <div className="dashTop"><div><div className="eyebrow">YOUR PRIVATE STUDIO</div><h1>Good ideas start here.</h1><p>Pick up where you left off or start something worth explaining.</p></div><Link href="/projects/new" className="button"><span aria-hidden="true">＋</span> New explainer</Link></div>
      <div className="dashToolbar"><h2>My videos <span aria-label={`${projects.length} projects`}>{projects.length}</span></h2><span>Recently updated</span></div>
      <ProjectLibrary projects={projects.map(project => ({ id: project._id.toHexString(), title: project.title, topic: project.draft?.topic || "", state: project.state, updatedAt: project.updatedAt.toISOString() }))}/>
    </section>
  </main>;
}
