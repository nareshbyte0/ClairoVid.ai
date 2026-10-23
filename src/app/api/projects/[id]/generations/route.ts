import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { getOwnedProject } from "@/domain/project";
import { getDb } from "@/db/mongo";
import { synthesizeNarration } from "@/providers/elevenlabs";
import { putPrivateObject, getPrivateObjectUrl } from "@/storage/r2";
import { alignmentToWordCues, wordCuesToVtt } from "@/pipeline/captions";
import { createHash, randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = (await auth.api.getSession({ headers: await headers() }))?.user;
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const project = await getOwnedProject(user.id, (await params).id);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (typeof body?.storyboardId !== "string" || !ObjectId.isValid(body.storyboardId)) return Response.json({ error: "Choose a reviewed storyboard." }, { status: 422 });
  const db = await getDb();
  const storyboard = await db.collection("storyboards").findOne({ _id: new ObjectId(body.storyboardId), ownerId: user.id, projectId: project._id, reviewState: "approved" });
  if (!storyboard) return Response.json({ error: "Approve this storyboard before creating narration." }, { status: 422 });
  const preset = storyboard.voicePreset || project.draft?.voicePreset;
  if (preset !== "indian_male" && preset !== "indian_female") return Response.json({ error: "Choose a configured V1 voice." }, { status: 422 });
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET) return Response.json({ error: "Private media storage is not configured. No paid provider call was made." }, { status: 503 });
  const narration = (storyboard.content.scenes as { narration: string }[]).map(scene => scene.narration).join("\n\n");
  if (narration.length > 5000) return Response.json({ error: "Narration is too long to synthesize in one request." }, { status: 422 });

  const jobId = new ObjectId();
  const now = new Date();
  await db.collection("jobs").insertOne({ _id: jobId, ownerId: user.id, projectId: project._id, type: "generation", state: "running", stage: "speech", progress: { stage: "Generating narration", completed: 0, total: 1 }, startedAt: now, createdAt: now, updatedAt: now });
  try {
    const audio = await synthesizeNarration(narration, preset);
    const cues = alignmentToWordCues(audio.alignment);
    const bytes = Buffer.from(audio.audioBase64, "base64");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const assetId = new ObjectId();
    const base = `owners/${user.id}/projects/${project._id.toHexString()}/jobs/${jobId.toHexString()}/${randomUUID()}`;
    const audioKey = `${base}.mp3`;
    const captionsKey = `${base}.vtt`;
    await putPrivateObject(audioKey, bytes, "audio/mpeg");
    await putPrivateObject(captionsKey, new TextEncoder().encode(wordCuesToVtt(cues)), "text/vtt; charset=utf-8");
    await db.collection("assets").insertMany([
      { _id: assetId, ownerId: user.id, projectId: project._id, jobId, kind: "narration", objectKey: audioKey, sha256, bytes: bytes.length, contentType: "audio/mpeg", state: "ready", voicePreset: preset, createdAt: new Date() },
      { _id: new ObjectId(), ownerId: user.id, projectId: project._id, jobId, kind: "captions", objectKey: captionsKey, contentType: "text/vtt; charset=utf-8", state: "ready", cueCount: cues.length, createdAt: new Date() },
    ]);
    const audioUrl = await getPrivateObjectUrl(audioKey);
    await db.collection("jobs").updateOne({ _id: jobId, ownerId: user.id }, { $set: { state: "partial", stage: "render", progress: { stage: "Narration and timed captions ready; waiting for video renderer", completed: 1, total: 1 }, assetId, updatedAt: new Date() } });
    return Response.json({ jobId: jobId.toHexString(), state: "partial", stage: "render", audioUrl, cues, sha256, notice: "Narration and word-timed captions are ready. Video rendering is not enabled until the isolated Remotion renderer is configured." }, { status: 202, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    await db.collection("jobs").updateOne({ _id: jobId, ownerId: user.id }, { $set: { state: "failed", stage: "speech", sanitizedError: message, updatedAt: new Date() } });
    return Response.json({ error: message, jobId: jobId.toHexString() }, { status: 503 });
  }
}
