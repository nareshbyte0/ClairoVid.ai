import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth/server";
import { getOwnedProject } from "@/domain/project";
import { IdeaEditor } from "@/components/idea-editor";
export const dynamic="force-dynamic";
export default async function IdeaPage({params}:{params:Promise<{id:string}>}) { const user=(await auth.api.getSession({headers:await headers()}))?.user; if(!user) redirect("/sign-in"); const project=await getOwnedProject(user.id,(await params).id); if(!project) notFound(); return <main className="editorShell"><header className="editorHeader"><Link className="brand" href="/">Clairo<span>Vid</span><small>.ai</small></Link><Link href="/dashboard" className="backLink">← All projects</Link><div className="saveState">Private workspace</div></header><div className="stepsLine"><span className="active"><b>01</b> Idea</span><i/><span><b>02</b> Storyboard</span><i/><span><b>03</b> Video</span><i/><span><b>04</b> Publish</span></div><IdeaEditor project={{id:project._id.toHexString(),title:project.title,draft:project.draft,draftRevision:project.draftRevision}}/></main>; }
