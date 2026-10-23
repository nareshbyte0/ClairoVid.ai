import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { createProject, listProjects } from "@/domain/project";
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
  const parsed = z.object({ title: z.string().trim().max(100).optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid project title." }, { status: 422 });
  return Response.json({ project: await createProject(user.id, parsed.data.title || "") }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
