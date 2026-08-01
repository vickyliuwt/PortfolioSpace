// indexer.js
// mongo to es

import mongoose from "mongoose";
import { PROJECT_INDEX, MESSAGE_INDEX, bulkIndex, ensureIndexes, wipe } from "./es.js";

const coll = (name) => mongoose.connection.collection(name);

// to doc
function projectDoc(p) {
  return {
    id: p._id,
    title: p.title || "",
    summary: p.summary || "",
    description: p.description || "",
    tags: p.tags || [],
    tools: p.tools || [],
    ownerName: p.ownerName || "",
    ownerUsername: p.ownerUsername || "",
    owner: p.owner || "",
    kind: p.kind || "other",
    category: p.category || "",
    coverUrl: p.coverUrl || "",
    likes: p.likes || 0,
    views: p.views || 0,
    createdAt: p.createdAt || new Date(),
  };
}

// to doc
function messageDoc(m) {
  return {
    id: m._id,
    text: m.text || "",
    from: m.from,
    to: m.to,
    createdAt: m.createdAt || new Date(),
  };
}

// rebuild
export async function reindexAll({ fresh = false } = {}) {
  if (fresh) {
    await wipe(PROJECT_INDEX);
    await wipe(MESSAGE_INDEX);
  }
  await ensureIndexes();

  const projects = await coll("projects")
    .find({ visibility: "PUBLIC", status: { $ne: "DRAFT" } })
    .limit(5000)
    .toArray();
  const messages = await coll("messages").find({ text: { $ne: "" } }).limit(20000).toArray();

  const p = await bulkIndex(PROJECT_INDEX, projects.map(projectDoc));
  const m = await bulkIndex(MESSAGE_INDEX, messages.map(messageDoc));
  return { projects: p, messages: m };
}

// one doc
export async function indexOneProject(id) {
  const row = await coll("projects").findOne({ _id: id });
  if (!row) return false;
  await bulkIndex(PROJECT_INDEX, [projectDoc(row)]);
  return true;
}
