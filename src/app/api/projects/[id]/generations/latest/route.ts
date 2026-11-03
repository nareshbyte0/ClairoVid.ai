import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/auth/server";
import { getOwnedProject } from "@/domain/project";
import { getDb } from "@/db/mongo";
import { getPrivateObjectUrl } from "@/storage/r2";

export const runtime = "nodejs";

const cueSchema = z.object({ text: z.string().min(1).max(200), start: z.number().finite().nonnegative(), end: z.number().finite().nonnegative() });

function privateStorageConfigured() {
  return Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = (await auth.api.getSession({ headers: await headers() }))?.user;
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });

  const project = await getOwnedProject(user.id, (await params).id);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404 });

  const storyboardId = new URL(request.url).searchParams.get("storyboardId");
  if (!storyboardId || !ObjectId.isValid(storyboardId)) return Response.json({ error: "Choose a valid storyboard." }, { status: 422 });

  if (!privateStorageConfigured()) {
    return Response.json({ available: false, previewOnly: true, notice: "This development preview is temporary and cannot be restored after leaving the page. Configure private R2 storage to keep narration and captions." }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const db = await getDb();
  const job = await db.collection("jobs").findOne({
    ownerId: user.id,
    projectId: project._id,
    storyboardId: new ObjectId(storyboardId),
    type: "generation",
    state: "partial",
    stage: "render",
    developmentPreviewOnly: { $ne: true },
  }, { sort: { updatedAt: -1 } });
  if (!job || !(job.assetId instanceof ObjectId) || !(job.captionAssetId instanceof ObjectId)) {
    return Response.json({ available: false, previewOnly: false }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const [audioAsset, captionAsset] = await Promise.all([
    db.collection("assets").findOne({ _id: job.assetId, ownerId: user.id, projectId: project._id, jobId: job._id, kind: "narration", state: "ready" }),
    db.collection("assets").findOne({ _id: job.captionAssetId, ownerId: user.id, projectId: project._id, jobId: job._id, kind: "captions", state: "ready" }),
  ]);
  const cues = z.array(cueSchema).max(2_000).safeParse(job.captionCues);
  if (!audioAsset || typeof audioAsset.objectKey !== "string" || !captionAsset || !cues.success || cues.data.length === 0) {
    return Response.json({ error: "The saved narration or caption data is incomplete. Retry narration generation." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }

  try {
    const audioUrl = await getPrivateObjectUrl(audioAsset.objectKey);
    return Response.json({
      available: true,
      jobId: job._id.toHexString(),
      audioUrl,
      cues: cues.data,
      previewOnly: false,
      notice: "Narration and timed captions are saved privately and can be restored when you return to this storyboard. MP4 rendering is not enabled yet.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Private narration storage is temporarily unavailable. Your storyboard remains safe; retry loading this preview shortly." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
