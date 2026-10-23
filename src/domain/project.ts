import { ObjectId } from "mongodb";
import { getDb } from "@/db/mongo";

export type ProjectDraft = { topic: string; audience: string; notes: string; voicePreset: "indian_male" | "indian_female" };
export async function createProject(ownerId: string, title: string) {
  const db = await getDb(); const now = new Date(); const id = new ObjectId();
  const draft: ProjectDraft = { topic: "", audience: "", notes: "", voicePreset: "indian_male" };
  await db.collection("projects").insertOne({ _id: id, ownerId, title: title || "Untitled explainer", draftRevision: 0, draft, state: "draft", createdAt: now, updatedAt: now, deletedAt: null });
  return { id: id.toHexString(), title: title || "Untitled explainer", draft, draftRevision: 0, state: "draft", updatedAt: now };
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
  const db = await getDb(); const now = new Date();
  const result = await db.collection("projects").findOneAndUpdate(
    { _id: new ObjectId(id), ownerId, deletedAt: null, draftRevision: expectedRevision },
    { $set: { draft, updatedAt: now }, $inc: { draftRevision: 1 } }, { returnDocument: "after", includeResultMetadata: false }
  );
  return result;
}
