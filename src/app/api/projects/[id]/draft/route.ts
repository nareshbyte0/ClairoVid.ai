import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { getOwnedProject, saveDraft } from "@/domain/project";
import { z } from "zod";
export const runtime = "nodejs";
const draftSchema = z.object({ topic: z.string().max(2000), audience: z.string().max(300), notes: z.string().max(20000), voicePreset: z.enum(["indian_male", "indian_female"]) });
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = (await auth.api.getSession({ headers: await headers() }))?.user; if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const project = await getOwnedProject(user.id, (await params).id); if (!project) return Response.json({ error: "Project not found." }, { status: 404 });
  return Response.json({ draft: project.draft, revision: project.draftRevision }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = (await auth.api.getSession({ headers: await headers() }))?.user; if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null); const parsed = z.object({ expectedRevision: z.number().int().nonnegative(), draft: draftSchema }).safeParse(body);
  if (!parsed.success) return Response.json({ error: "Draft is invalid.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  const result = await saveDraft(user.id, (await params).id, parsed.data.expectedRevision, parsed.data.draft);
  if (!result) {
    const exists = await getOwnedProject(user.id, (await params).id); if (!exists) return Response.json({ error: "Project not found." }, { status: 404 });
    return Response.json({ error: "Draft changed in another session. Reload before saving.", revision: exists.draftRevision }, { status: 409 });
  }
  return Response.json({ draft: result.draft, revision: result.draftRevision }, { headers: { "Cache-Control": "private, no-store" } });
}
