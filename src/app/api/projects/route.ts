import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { createProject, listProjects, ProjectCreateConflictError } from "@/domain/project";
import { z } from "zod";

export const runtime = "nodejs";
async function owner() { return (await auth.api.getSession({ headers: await headers() }))?.user ?? null; }
export async function GET() {
  const user = await owner(); if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const projects = await listProjects(user.id);
  return Response.json({ projects: projects.map(p => ({ id: p._id.toHexString(), title: p.title, state: p.state, updatedAt: p.updatedAt, draft: p.draft, draftRevision: p.draftRevision })) }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(request: Request) {
  const user = await owner(); if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const key = z.string().uuid().safeParse(request.headers.get("Idempotency-Key"));
  if (!key.success) return Response.json({ error: "A valid Idempotency-Key is required." }, { status: 400 });
  const parsed = z.object({ title: z.string().trim().max(100).optional() }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid project title." }, { status: 422 });
  try {
    const project = await createProject(user.id, parsed.data.title || "", key.data);
    return Response.json({ project }, { status: project.replayed ? 200 : 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof ProjectCreateConflictError) return Response.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
