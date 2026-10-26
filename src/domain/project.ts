import { ObjectId } from "mongodb";
import { createHash } from "node:crypto";
import { getDb } from "@/db/mongo";

export type ProjectDraft = { topic: string; audience: string; notes: string; voicePreset: "indian_male" | "indian_female" };
export class ProjectCreateConflictError extends Error {}

export async function createProject(ownerId: string, title: string, idempotencyKey: string) {
  const db = await getDb();
  const normalizedTitle = title.trim().replace(/\s+/g, " ").slice(0, 100) || "Untitled explainer";
  const requestHash = createHash("sha256").update(JSON.stringify({ title: normalizedTitle })).digest("hex");
  const requestId = createHash("sha256").update(`${ownerId}\0project.create\0${idempotencyKey}`).digest().subarray(0, 12);
  const id = new ObjectId(requestId);
  const now = new Date();
  const draft: ProjectDraft = { topic: "", audience: "", notes: "", voicePreset: "indian_male" };
  try {
    await db.collection("projects").insertOne({ _id: id, ownerId, title: normalizedTitle, draftRevision: 0, draft, state: "draft", creationRequestHash: requestHash, createdAt: now, updatedAt: now, deletedAt: null });
    return { id: id.toHexString(), title: normalizedTitle, draft, draftRevision: 0, state: "draft", updatedAt: now, replayed: false };
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== 11000) throw error;
    const existing = await db.collection("projects").findOne({ _id: id, ownerId });
    if (!existing) throw error;
    if (existing.creationRequestHash !== requestHash || existing.deletedAt) throw new ProjectCreateConflictError("This project-creation request cannot be repeated with different input.");
    return { id: existing._id.toHexString(), title: existing.title, draft: existing.draft, draftRevision: existing.draftRevision, state: existing.state, updatedAt: existing.updatedAt, replayed: true };
  }
}
export async function listProjects(ownerId: string) {
  const db = await getDb();
  return db.collection("projects").find({ ownerId, deletedAt: null }).sort({ updatedAt: -1 }).limit(50).toArray();
}
export async function getOwnedProject(ownerId: string, id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  return db.collection("projects").findOne({ _id: new ObjectId(id), ownerId, deletedAt: null });
}
export async function saveDraft(ownerId: string, id: string, expectedRevision: number, draft: ProjectDraft) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const now = new Date();
  const titleFromIdea = draft.topic.trim().replace(/\s+/g, " ").slice(0, 100) || "Untitled explainer";
  return db.collection("projects").findOneAndUpdate(
    { _id: new ObjectId(id), ownerId, deletedAt: null, draftRevision: expectedRevision },
    [{ $set: {
      draft: { $literal: draft },
      updatedAt: now,
      title: { $cond: [{ $eq: ["$title", "Untitled explainer"] }, { $literal: titleFromIdea }, "$title"] },
      draftRevision: { $add: ["$draftRevision", 1] },
    } }],
    { returnDocument: "after", includeResultMetadata: false },
  );
}
