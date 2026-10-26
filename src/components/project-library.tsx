"use client";
import Link from "next/link";
import { useState } from "react";

type Project = { id: string; title: string; topic: string; state: string; updatedAt: string };
const filters = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "ready", label: "Ready" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
  { id: "needs_attention", label: "Needs attention" },
] as const;
function category(state: string) {
  if (state === "ready" || state === "complete") return "ready";
  if (state === "scheduled") return "scheduled";
  if (state === "published") return "published";
  if (state === "needs_attention" || state === "failed") return "needs_attention";
  return "draft";
}
function stateLabel(state: string) {
  const normalized = category(state);
  if (normalized === "draft") return "IDEA DRAFT";
  return normalized === "needs_attention" ? "NEEDS ATTENTION" : normalized.toUpperCase();
}

function ProjectArtwork({ state }: { state: string }) {
  const current = category(state);
  const stage = current === "draft" ? "IDEA STAGE · NO VIDEO YET" : `PROJECT · ${stateLabel(state)}`;
  return <div className={`projectThumb projectThumb--${current}`} aria-hidden="true">
    <div className="projectThumbMeta"><span>CLAIROVID / EXPLAINER</span><span>{stateLabel(state)}</span></div>
    <div className="projectThumbFlow">
      <span className="projectThumbNode">01</span><i/><span className="projectThumbNode active">02</span><i/><span className="projectThumbNode">03</span>
    </div>
    <div className="projectThumbFooter"><span>{stage}</span><b>→</b></div>
  </div>;
}

export function ProjectLibrary({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<(typeof filters)[number]["id"]>("all");
  const counts: Record<(typeof filters)[number]["id"], number> = {
    all: projects.length,
    draft: projects.filter(project => category(project.state) === "draft").length,
    ready: projects.filter(project => category(project.state) === "ready").length,
    scheduled: projects.filter(project => category(project.state) === "scheduled").length,
    published: projects.filter(project => category(project.state) === "published").length,
    needs_attention: projects.filter(project => category(project.state) === "needs_attention").length,
  };
  const visible = active === "all" ? projects : projects.filter(project => category(project.state) === active);

  if (!projects.length) return <div className="emptyState"><div className="emptyOrb">✳</div><h2>Your next clear explanation starts with an idea.</h2><p>Write a topic, add a little context, and ClairoVid will help shape it into a storyboard.</p><Link href="/projects/new" className="button">Start your first explainer <span>↗</span></Link></div>;

  return <>
    <div className="libraryFilters" role="group" aria-label="Filter videos by status">
      {filters.map(filter => <button type="button" key={filter.id} className="libraryFilter" aria-pressed={active === filter.id} onClick={() => setActive(filter.id)}>{filter.label}<b>{counts[filter.id]}</b></button>)}
    </div>
    {visible.length ? <div className="projectGrid">{visible.map(project => <Link className="projectCard" key={project.id} href={`/projects/${project.id}/idea`} aria-label={`Continue ${project.title}`}>
      <ProjectArtwork state={project.state}/>
      <div className="projectCardBody"><h3>{project.title}</h3><p>{project.topic || "Add the idea you want to explain"}</p><div className="projectCardMeta"><small>Updated {new Date(project.updatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" })}</small><span className="projectCardAction">Continue <b aria-hidden="true">→</b></span></div></div>
    </Link>)}</div> : <div className="filterEmpty"><h2>No {filters.find(filter => filter.id === active)?.label.toLowerCase()} yet</h2><p>Your videos will appear here when they reach this stage. Your other projects are still in the library.</p><button type="button" onClick={() => setActive("all")}>Show all videos</button></div>}
  </>;
}

