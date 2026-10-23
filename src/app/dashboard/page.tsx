import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth/server";
import { listProjects } from "@/domain/project";
import { SignOut } from "@/components/sign-out";
export const dynamic = "force-dynamic";
export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() }); if (!session) redirect("/sign-in");
  const projects = await listProjects(session.user.id);
  return <main className="workspace"><aside className="sidebar"><Link className="brand" href="/">Clairo<span>Vid</span><small>.ai</small></Link><div className="sideLabel">YOUR WORKSPACE</div><Link className="sideItem selected" href="/dashboard"><span>▦</span> Projects</Link><Link className="sideItem" href="/settings"><span>⚙</span> Settings</Link><div className="sideBottom"><div className="userBadge">{session.user.name?.slice(0,1).toUpperCase() || "C"}</div><div className="userName">{session.user.name}<small>{session.user.email}</small></div><SignOut/></div></aside><section className="dashMain"><div className="dashTop"><div><div className="eyebrow">YOUR PRIVATE STUDIO</div><h1>Good ideas start here.</h1><p>Pick up where you left off or start something worth explaining.</p></div><Link href="/projects/new" className="button">＋ New explainer</Link></div><div className="dashToolbar"><h2>Your projects <span>{projects.length.toString().padStart(2,"0")}</span></h2><span>Sorted by recent</span></div>{projects.length === 0 ? <div className="emptyState"><div className="emptyOrb">✳</div><h2>Your next clear explanation starts with an idea.</h2><p>Write a topic, add a little context, and ClairoVid will help you shape it into a storyboard.</p><Link href="/projects/new" className="button">Start your first explainer <span>↗</span></Link></div> : <div className="projectGrid">{projects.map(p=><Link className="projectCard" key={p._id.toHexString()} href={`/projects/${p._id.toHexString()}/idea`}><div className="projectThumb"><span>✳</span><small>{p.state === "draft" ? "DRAFT" : p.state.toUpperCase()}</small></div><div className="projectCardBody"><h3>{p.title}</h3><p>{p.draft?.topic || "Add the idea you want to explain"}</p><small>Edited {new Date(p.updatedAt).toLocaleDateString()}</small></div></Link>)}</div>}</section></main>;
}
