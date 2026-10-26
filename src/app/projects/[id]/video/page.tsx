import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth/server";
import { BrandLogo } from "@/components/brand-logo";
import { getOwnedProject } from "@/domain/project";
import { VideoStage } from "@/components/video-stage";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ storyboard?: string }> }) {
  const user = (await auth.api.getSession({ headers: await headers() }))?.user;
  if (!user) redirect("/sign-in");
  const project = await getOwnedProject(user.id, (await params).id);
  if (!project) notFound();
  const storyboardId = (await searchParams).storyboard || "";

  return <main className="editorShell">
    <header className="editorHeader">
      <BrandLogo href="/dashboard" label="ClairoVid.ai — My videos" />
      <Link href={`/projects/${project._id.toHexString()}/storyboard`} className="backLink">← Back to storyboard</Link>
      <div className="saveState">Private workspace</div>
    </header>
    <div className="stepsLine"><span className="done"><b>✓</b> Idea</span><i/><span className="done"><b>✓</b> Storyboard</span><i/><span className="active"><b>03</b> Video</span><i/><span><b>04</b> Publish</span></div>
    <VideoStage projectId={project._id.toHexString()} storyboardId={storyboardId} />
  </main>;
}
