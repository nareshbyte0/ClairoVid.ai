import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { getOwnedProject } from "@/domain/project";
import { brainstormTopics } from "@/providers/gemini";
import { z } from "zod";

export const runtime = "nodejs";
const requestSchema = z.object({
  topic: z.string().trim().max(2000).optional().default(""),
  audience: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(20_000).optional().default(""),
});
const requests = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = (await auth.api.getSession({ headers: await headers() }))?.user;
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const project = await getOwnedProject(user.id, (await params).id);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check your subject, audience, and teaching notes." }, { status: 422 });

  const now = Date.now();
  let limit = requests.get(user.id);
  if (!limit || now >= limit.resetAt) limit = { count: 0, resetAt: now + WINDOW_MS };
  if (limit.count >= MAX_REQUESTS) {
    return Response.json({ error: "You’ve reached the short brainstorming limit. Wait a minute and try again." }, { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - now) / 1000)) } });
  }
  limit.count += 1;
  requests.set(user.id, limit);

  try {
    const ideas = await brainstormTopics({ ...parsed.data, topic: parsed.data.topic || project.draft?.topic || "", audience: parsed.data.audience || project.draft?.audience || "", notes: parsed.data.notes || project.draft?.notes || "" });
    return Response.json({ ideas }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not brainstorm ideas." }, { status: 502 });
  }
}
