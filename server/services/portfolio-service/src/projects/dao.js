// projects/dao.js
// db ops for projects

import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import model from "./model.js";
import { notify } from "../shared/notify.js";
import saveModel from "../saves/model.js";
import dailyModel from "./dailyStatModel.js";

const KIND_VALUES = ["art", "code", "film", "photo", "music", "writing", "daily", "other"];
const MAX_COLLABS = 10;

// handles to real people
export async function resolveCollaborators(list, ownerId) {
  if (!Array.isArray(list)) return [];

  // takes a string or an object
  const wanted = [];
  const seen = new Set();
  for (const row of list) {
    const raw = typeof row === "string" ? row : row?.username;
    const name = String(raw || "").trim().replace(/^@/, "").toLowerCase();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    wanted.push({ username: name, role: String((typeof row === "object" && row?.role) || "").trim().slice(0, 60) });
    if (wanted.length >= MAX_COLLABS) break;
  }
  if (wanted.length === 0) return [];

  const rows = await mongoose.connection
    .collection("users")
    .find(
      { username: { $in: wanted.map((w) => new RegExp(`^${escapeRx(w.username)}$`, "i")) } },
      { projection: { username: 1, displayName: 1, avatarUrl: 1 } }
    )
    .toArray();

  const byName = new Map(rows.map((u) => [String(u.username).toLowerCase(), u]));
  const out = [];
  for (const w of wanted) {
    const u = byName.get(w.username);
    if (!u) continue; // unknown handle, skip quietly
    if (u._id === ownerId) continue; // owner is already credited
    out.push({
      user: u._id,
      username: u.username || "",
      name: u.displayName || u.username || "",
      avatar: u.avatarUrl || "",
      role: w.role,
    });
  }
  return out;
}

// owner or a credited teammate
export function canEdit(project, userId) {
  if (!project || !userId) return false;
  if (project.owner === userId) return true;
  return (project.collaborators || []).some((c) => c.user === userId);
}

// credit pings
export function notifyCredits(project, actor, userIds) {
  for (const uid of userIds || []) {
    notify({
      user: uid,
      type: "collab",
      actor: actor._id,
      actorName: actor.displayName || actor.username,
      actorUsername: actor.username,
      project: project._id,
      projectTitle: project.title,
    });
  }
}

// new project
export async function createProject(owner, ownerInfo, data) {
  const doc = {
    _id: uuid(),
    owner,
    ownerUsername: ownerInfo.username || "",
    ownerName: ownerInfo.displayName || ownerInfo.username || "",
    ownerAvatar: ownerInfo.avatarUrl || "",
    title: data.title,
    summary: data.summary || "",
    description: data.description || "",
    category: data.category || "Other",
    tags: cleanList(data.tags),
    tools: cleanList(data.tools),
    coverKey: data.coverKey || "",
    coverUrl: data.coverUrl || "",
    media: Array.isArray(data.media) ? data.media : [],
    externalUrl: data.externalUrl || "",
    repoUrl: data.repoUrl || "",
    demoUrl: data.demoUrl || "",
    visibility: ["PUBLIC", "FRIENDS", "PRIVATE"].includes(data.visibility) ? data.visibility : "PUBLIC",
    status: data.status === "DRAFT" ? "DRAFT" : "PUBLISHED",
    role: (data.role || "").trim(),
    highlights: cleanList(data.highlights),
    year: (data.year || "").trim(),
    kind: KIND_VALUES.includes(data.kind) ? data.kind : "other",
    collaborators: await resolveCollaborators(data.collaborators, owner),
  };
  const made = await model.create(doc);
  notifyCredits(made, { _id: owner, ...ownerInfo }, doc.collaborators.map((c) => c.user));
  return made;
}

export const findById = (id) => model.findById(id);

// how many projects a user has (free cap check)
export const countByOwner = (owner) => model.countDocuments({ owner });

// projects for one owner (mine or someone's public)
export function findByOwner(owner, includePrivate = false) {
  const q = { owner };
  if (!includePrivate) {
    q.visibility = "PUBLIC";
    q.status = { $ne: "DRAFT" };
  }
  return model.find(q).sort({ createdAt: -1 });
}

// mine plus shared
export function workingSetOf(userId) {
  return model
    .find({ $or: [{ owner: userId }, { "collaborators.user": userId }] })
    .sort({ createdAt: -1 });
}

// ids i blocked or who blocked me
export async function hiddenOwners(viewerId) {
  if (!viewerId) return [];
  const rows = await mongoose.connection
    .collection("blocks")
    .find({ $or: [{ blocker: viewerId }, { blocked: viewerId }] })
    .toArray();
  const set = new Set();
  for (const r of rows) set.add(r.blocker === viewerId ? r.blocked : r.blocker);
  return [...set];
}

// is this account private
async function isPrivateAccount(ownerId) {
  const u = await mongoose.connection.collection("users").findOne({ _id: ownerId }, { projection: { privateAccount: 1 } });
  return !!u?.privateAccount;
}

// follow check
export async function isFollower(viewerId, ownerId) {
  if (!viewerId || !ownerId) return false;
  if (viewerId === ownerId) return true;
  const row = await mongoose.connection.collection("follows").findOne({ follower: viewerId, following: ownerId });
  return !!row;
}

// visible work
export async function publicProjectsOf(owner, viewerId) {
  const friend = await isFollower(viewerId, owner);
  if (!friend && (await isPrivateAccount(owner))) return [];
  const vis = friend ? ["PUBLIC", "FRIENDS"] : ["PUBLIC"];

  // own work plus public credits
  const q = {
    status: { $ne: "DRAFT" },
    $or: [
      { owner, visibility: { $in: vis } },
      { "collaborators.user": owner, visibility: "PUBLIC" },
    ],
  };
  const hidden = await hiddenOwners(viewerId);
  if (hidden.length) q.owner = { $nin: hidden };

  return model.find(q).sort({ createdAt: -1 });
}

// update (owner only, checked in route)
export async function updateProject(id, updates) {
  const clean = { ...updates };
  delete clean._id;
  delete clean.owner;
  delete clean.likes;
  delete clean.likedBy;
  delete clean.views;
  if (clean.tags) clean.tags = cleanList(clean.tags);
  if (clean.tools) clean.tools = cleanList(clean.tools);
  if (clean.highlights) clean.highlights = cleanList(clean.highlights);
  if (clean.kind && !KIND_VALUES.includes(clean.kind)) delete clean.kind;
  if (clean.visibility && !["PUBLIC", "FRIENDS", "PRIVATE"].includes(clean.visibility)) delete clean.visibility;
  if (clean.status && !["PUBLISHED", "DRAFT"].includes(clean.status)) delete clean.status;

  // keep the last ten snapshots
  const before = await model.findById(id).select("title summary description coverUrl category owner");
  if (clean.collaborators !== undefined) {
    clean.collaborators = await resolveCollaborators(clean.collaborators, before?.owner);
  }
  if (before) {
    const snap = {
      at: new Date(),
      title: before.title || "",
      summary: before.summary || "",
      description: before.description || "",
      coverUrl: before.coverUrl || "",
      category: before.category || "",
    };
    await model.updateOne({ _id: id }, { $push: { versions: { $each: [snap], $slice: -10 } } });
  }

  await model.updateOne({ _id: id }, { $set: clean });
  return model.findById(id);
}

// past edits, newest first
export async function versionsOf(id) {
  const doc = await model.findById(id).select("versions");
  if (!doc) return [];
  return [...(doc.versions || [])].reverse();
}

// put an old snapshot back
export async function restoreVersion(id, index) {
  const doc = await model.findById(id).select("versions title summary description coverUrl category");
  if (!doc) return null;
  const list = [...(doc.versions || [])].reverse();
  const pick = list[Number(index)];
  if (!pick) return null;
  return updateProject(id, {
    title: pick.title,
    summary: pick.summary,
    description: pick.description,
    coverUrl: pick.coverUrl,
    category: pick.category,
  });
}

export const deleteProject = (id) => model.deleteOne({ _id: id });

// discover
export async function discover({ q, kind, category, tag, sort, limit = 40, page = 0, viewerId = "" } = {}) {
  const filter = { visibility: "PUBLIC", status: { $ne: "DRAFT" } };

  const hidden = await hiddenOwners(viewerId);
  if (hidden.length) filter.owner = { $nin: hidden };

  if (kind && kind !== "All") filter.kind = kind;
  if (category && category !== "All") filter.category = category;
  if (tag) filter.tags = new RegExp(`^${escapeRx(tag)}$`, "i");

  let cursor;
  if (q && q.trim()) {
    // keyword search (regex so partials work too)
    const rx = new RegExp(escapeRx(q.trim()), "i");
    filter.$or = [{ title: rx }, { summary: rx }, { description: rx }, { tags: rx }, { tools: rx }, { ownerName: rx }, { ownerUsername: rx }];
  }

  cursor = model.find(filter);

  // sorting
  if (sort === "popular") cursor = cursor.sort({ likes: -1, views: -1, createdAt: -1 });
  else if (sort === "views") cursor = cursor.sort({ views: -1, createdAt: -1 });
  else cursor = cursor.sort({ createdAt: -1 }); // newest

  const size = Math.min(limit, 100);
  const skip = Math.max(0, Number(page) || 0) * size;
  return cursor.skip(skip).limit(size);
}

// featured for the hero
export function findFeatured(n = 5) {
  return model
    .find({ visibility: "PUBLIC", status: { $ne: "DRAFT" } })
    .sort({ featured: -1, likes: -1, createdAt: -1 })
    .limit(n);
}

// like toggle (actor = current user object)
export async function toggleLike(id, actor) {
  const proj = await model.findById(id);
  if (!proj) return null;

  const uid = actor._id;
  const liked = proj.likedBy.includes(uid);
  if (liked) {
    proj.likedBy = proj.likedBy.filter((u) => u !== uid);
    proj.likes = Math.max(0, proj.likes - 1);
  } else {
    proj.likedBy.push(uid);
    proj.likes += 1;
  }
  await proj.save();

  if (!liked) {
    void recordDaily(proj.owner, "likes");
    notify({
      user: proj.owner,
      type: "like",
      actor: uid,
      actorName: actor.displayName || actor.username,
      actorUsername: actor.username,
      project: proj._id,
      projectTitle: proj.title,
    });
  }
  return { likes: proj.likes, liked: !liked };
}

// reels feed
export function reelsFeed(limit = 30) {
  return model
    .find({ visibility: "PUBLIC", status: { $ne: "DRAFT" }, $or: [{ coverUrl: { $ne: "" } }, { "media.0": { $exists: true } }] })
    .sort({ likes: -1, views: -1, createdAt: -1 })
    .limit(Math.min(limit, 60));
}

// similar work
export async function similarTo(id, limit = 6) {
  const base = await model.findById(id).select("kind category tags owner");
  if (!base) return [];
  const candidates = await model
    .find({
      _id: { $ne: id },
      visibility: "PUBLIC",
      status: { $ne: "DRAFT" },
      $or: [{ kind: base.kind }, { category: base.category }, { tags: { $in: base.tags || [] } }],
    })
    .limit(80);

  const tagSet = new Set(base.tags || []);
  const scored = candidates.map((p) => {
    let score = 0;
    if (p.category === base.category) score += 3;
    if (p.kind === base.kind) score += 2;
    (p.tags || []).forEach((t) => {
      if (tagSet.has(t)) score += 2;
    });
    if (p.owner === base.owner) score += 1;
    score += Math.min(2, (p.likes || 0) / 25);
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.p);
}

// follow feed
export function feedFor(owners, limit = 40) {
  if (!Array.isArray(owners) || owners.length === 0) return [];
  return model
    .find({ owner: { $in: owners }, visibility: { $in: ["PUBLIC", "FRIENDS"] }, status: { $ne: "DRAFT" } })
    .sort({ createdAt: -1 })
    .limit(limit);
}

// for you
// popularity, freshness, and a boost for people i follow. falls back to
// trending for brand-new accounts with no signals.
export async function recommendFor(userId, boostOwners = [], limit = 40) {
  const liked = await model.find({ likedBy: userId }).select("category tags kind").limit(120);
  const savedRows = await saveModel.find({ user: userId }).select("project");
  const savedIds = savedRows.map((r) => r.project);
  const saved = savedIds.length ? await model.find({ _id: { $in: savedIds } }).select("category tags kind") : [];

  const tagW = new Map();
  const catW = new Map();
  const kindW = new Map();
  const bump = (map, key, n) => map.set(key, (map.get(key) || 0) + n);
  for (const p of [...liked, ...saved]) {
    if (p.category) bump(catW, p.category, 2);
    if (p.kind) bump(kindW, p.kind, 1.5);
    (p.tags || []).forEach((t) => bump(tagW, t, 1));
  }

  const seen = new Set([...savedIds, ...liked.map((p) => p._id)]);
  const boost = new Set(boostOwners || []);

  const candidates = await model
    .find({ visibility: "PUBLIC", status: { $ne: "DRAFT" }, owner: { $ne: userId }, _id: { $nin: [...seen] } })
    .sort({ createdAt: -1 })
    .limit(300);

  const now = Date.now();
  const scored = candidates.map((p) => {
    let score = 0;
    if (p.category) score += catW.get(p.category) || 0;
    if (p.kind) score += kindW.get(p.kind) || 0;
    (p.tags || []).forEach((t) => (score += tagW.get(t) || 0));
    score += Math.log10((p.likes || 0) + (p.views || 0) + 1) * 1.5; // popularity
    if (boost.has(p.owner)) score += 4; // followed creators
    const ageDays = (now - new Date(p.createdAt).getTime()) / 86400000;
    score += Math.max(0, 3 - ageDays / 7); // freshness
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.p);
}

// add view
export async function addView(id) {
  await model.updateOne({ _id: id }, { $inc: { views: 1 } });
}

// today key
function today() {
  return new Date().toISOString().slice(0, 10);
}

// bump daily
export async function recordDaily(owner, field) {
  if (!owner || (field !== "views" && field !== "likes")) return;
  const day = today();
  await dailyModel.updateOne(
    { _id: `${owner}:${day}` },
    { $inc: { [field]: 1 }, $setOnInsert: { owner, day } },
    { upsert: true }
  );
}

// trend rows
export async function trendFor(owner, days = 30) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const startDay = start.toISOString().slice(0, 10);
  const rows = await dailyModel.find({ owner, day: { $gte: startDay } }).select("day views likes");
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    const r = byDay.get(key);
    out.push({ day: key, views: r ? r.views : 0, likes: r ? r.likes : 0 });
  }
  return out;
}

// stats for a creator
export async function ownerStats(owner) {
  const list = await model.find({ owner });
  return {
    total: list.length,
    public: list.filter((p) => p.visibility === "PUBLIC" && p.status !== "DRAFT").length,
    drafts: list.filter((p) => p.status === "DRAFT").length,
    likes: list.reduce((s, p) => s + p.likes, 0),
    views: list.reduce((s, p) => s + p.views, 0),
  };
}

// tag list
export async function allTags() {
  const tags = await model.distinct("tags", { visibility: "PUBLIC", status: { $ne: "DRAFT" } });
  return tags.filter(Boolean).sort();
}

// helpers
function cleanList(v) {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}
function escapeRx(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function validate(data) {
  const errors = [];
  if (!data.title || !data.title.trim()) errors.push("title needed");
  if (data.title && data.title.length > 120) errors.push("title too long");
  return { ok: errors.length === 0, errors };
}
