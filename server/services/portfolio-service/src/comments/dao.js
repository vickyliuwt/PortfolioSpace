// comments/dao.js
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import model from "./model.js";
import projectModel from "../projects/model.js";
import { notify } from "../shared/notify.js";

export function listForProject(projectId) {
  return model.find({ project: projectId }).sort({ createdAt: -1 });
}

export async function addComment(projectId, author, text, parent = "") {
  const c = await model.create({
    _id: uuid(),
    project: projectId,
    author: author._id,
    authorName: author.displayName || author.username,
    authorUsername: author.username,
    authorAvatar: author.avatarUrl || "",
    text,
    parent: parent || "",
  });

  const actorName = author.displayName || author.username;
  try {
    const proj = await projectModel.findById(projectId).select("owner title");
    // notify owner
    if (proj) {
      notify({
        user: proj.owner,
        type: parent ? "reply" : "comment",
        actor: author._id,
        actorName,
        actorUsername: author.username,
        project: projectId,
        projectTitle: proj.title,
        text: text.slice(0, 80),
      });
    }
    // notify mentions
    // same lookbehind as MentionText, so an email does not ping a stranger
    const handles = [...new Set((text.match(/(?<![A-Za-z0-9_.@])@([a-zA-Z0-9_]+)/g) || []).map((m) => m.slice(1).toLowerCase()))];
    if (handles.length) {
      // match the handle whatever case it was typed in
      const rx = handles.map((h) => new RegExp(`^${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"));
      const users = await mongoose.connection.collection("users").find({ username: { $in: rx } }).toArray();
      for (const u of users) {
        notify({
          user: u._id,
          type: "mention",
          actor: author._id,
          actorName,
          actorUsername: author.username,
          project: projectId,
          projectTitle: proj ? proj.title : "",
          text: text.slice(0, 80),
        });
      }
    }
  } catch {
    // ignore
  }
  return c;
}

// comment like
export async function toggleLike(commentId, userId) {
  const c = await model.findById(commentId);
  if (!c) return null;
  const liked = c.likedBy.includes(userId);
  if (liked) {
    c.likedBy = c.likedBy.filter((u) => u !== userId);
    c.likes = Math.max(0, c.likes - 1);
  } else {
    c.likedBy.push(userId);
    c.likes += 1;
  }
  await c.save();
  return { likes: c.likes, liked: !liked };
}

// toggle reaction
export async function reactComment(commentId, emoji, userId) {
  const e = typeof emoji === "string" ? emoji.trim() : "";
  if (!e || e.length > 8) return null;
  const exists = await model.findOne({ _id: commentId, reactions: { $elemMatch: { emoji: e, user: userId } } }).select("_id");
  if (exists) {
    await model.updateOne({ _id: commentId }, { $pull: { reactions: { emoji: e, user: userId } } });
  } else {
    const found = await model.findById(commentId).select("_id");
    if (!found) return null;
    await model.updateOne({ _id: commentId }, { $push: { reactions: { emoji: e, user: userId } } });
  }
  const updated = await model.findById(commentId).select("reactions");
  return updated ? updated.reactions : null;
}

export const findById = (id) => model.findById(id);
export const remove = (id) => model.deleteOne({ _id: id });
export const countForProject = (projectId) => model.countDocuments({ project: projectId });
