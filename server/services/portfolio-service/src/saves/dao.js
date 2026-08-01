// saves/dao.js
import { v4 as uuid } from "uuid";
import model from "./model.js";
import projectModel from "../projects/model.js";
import { notify } from "../shared/notify.js";

// toggle: save if new, unsave if already there (actor = current user object)
export async function toggle(actor, projectId) {
  const uid = actor._id;
  const existing = await model.findOne({ user: uid, project: projectId });
  if (existing) {
    await model.deleteOne({ _id: existing._id });
    return { saved: false };
  }
  await model.create({ _id: uuid(), user: uid, project: projectId });
  // notify owner
  try {
    const proj = await projectModel.findById(projectId).select("owner title");
    if (proj) {
      notify({
        user: proj.owner,
        type: "save",
        actor: uid,
        actorName: actor.displayName || actor.username,
        actorUsername: actor.username,
        project: projectId,
        projectTitle: proj.title,
      });
    }
  } catch {
    // ignore
  }
  return { saved: true };
}

// one project saved?
export async function isSaved(userId, projectId) {
  const hit = await model.findOne({ user: userId, project: projectId });
  return !!hit;
}

// just the ids (button state across a grid)
export async function idsFor(userId) {
  const rows = await model.find({ user: userId }).select("project");
  return rows.map((r) => r.project);
}

// the actual saved projects, newest-saved first
// something saved back when it was public may have gone private since
export async function projectsFor(userId) {
  const rows = await model.find({ user: userId }).sort({ createdAt: -1 });
  const ids = rows.map((r) => r.project);
  if (ids.length === 0) return [];
  const projects = await projectModel.find({ _id: { $in: ids } });
  const visible = projects.filter(
    (p) => p.owner === userId || (p.status !== "DRAFT" && p.visibility !== "PRIVATE")
  );
  const byId = new Map(visible.map((p) => [p._id, p]));
  return ids.map((id) => byId.get(id)).filter(Boolean); // keep saved order
}
