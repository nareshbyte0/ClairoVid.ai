import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { getOwnedProject } from "@/domain/project";
import { generateStoryboard } from "@/providers/gemini";
export const runtime = "nodejs";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = (await auth.api.getSession({ headers: await headers() }))?.user; if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const project = await getOwnedProject(user.id, (await params).id); if (!project) return Response.json({ error: "Project not found." }, { status: 404 });
  if (!project.draft?.topic?.trim()) return Response.json({ error: "Add an idea before creating a storyboard." }, { status: 422 });
  try {
    const storyboard = await generateStoryboard(project.draft);
    const db = await (await import("@/db/mongo")).getDb(); const now = new Date();
    const record = await db.collection("storyboards").insertOne({ ownerId: user.id, projectId: project._id, sourceDraftRevision: project.draftRevision, content: storyboard, reviewState: "needs_review", createdAt: now });
    return Response.json({ id: record.insertedId.toHexString(), storyboard, sourceDraftRevision: project.draftRevision, reviewState: "needs_review" }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Storyboard could not be generated." }, { status: 502 }); }
}
