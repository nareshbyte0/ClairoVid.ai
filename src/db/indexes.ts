import { getDb } from "@/db/mongo";
export async function ensureIndexes(){const db=await getDb();await Promise.all([
 db.collection("projects").createIndex({ownerId:1,deletedAt:1,updatedAt:-1,_id:-1}),
 db.collection("storyboards").createIndex({ownerId:1,projectId:1,createdAt:-1}),
 db.collection("storyboards").createIndex({ownerId:1,projectId:1,reviewState:1}),
 db.collection("jobs").createIndex({ownerId:1,projectId:1,createdAt:-1}),
 db.collection("assets").createIndex({ownerId:1,projectId:1,kind:1,createdAt:-1}),
]);}
