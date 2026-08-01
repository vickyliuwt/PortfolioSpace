// collections/dao.js
import { v4 as uuid } from "uuid";
import model from "./model.js";
import projectModel from "../projects/model.js";

export async function create(owner, ownerInfo, data) {
  return model.create({
    _id: uuid(),
    owner,
    ownerUsername: ownerInfo.username || "",
    ownerName: ownerInfo.displayName || ownerInfo.username || "",
    title: data.title,
    description: data.description || "",
    coverUrl: data.coverUrl || "",
    projects: Array.isArray(data.projects) ? data.projects : [],
    visibility: data.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
  });
}

export const mine = (owner) => model.find({ owner }).sort({ createdAt: -1 });
export const publicByOwner = (owner) => model.find({ owner, visibility: "PUBLIC" }).sort({ createdAt: -1 });
export const getById = (id) => model.findById(id);

// board detail
// a board can be public while a project inside it is not, so filter per viewer
export async function withProjects(id, viewerId = "") {
  const col = await model.findById(id);
  if (!col) return null;
  let projects = [];
  if (col.projects.length) {
    const found = await projectModel.find({ _id: { $in: col.projects } });
    const visible = found.filter(
      (p) => p.owner === viewerId || (p.status !== "DRAFT" && p.visibility === "PUBLIC")
    );
    const byId = new Map(visible.map((p) => [p._id, p]));
    projects = col.projects.map((pid) => byId.get(pid)).filter(Boolean);
  }
  return { collection: col, projects };
}

export async function update(id, updates) {
  const clean = {};
  ["title", "description", "coverUrl", "visibility"].forEach((k) => {
    if (updates[k] !== undefined) clean[k] = updates[k];
  });
  await model.updateOne({ _id: id }, { $set: clean });
  return model.findById(id);
}

export const remove = (id) => model.deleteOne({ _id: id });
export const addProject = (id, pid) => model.updateOne({ _id: id }, { $addToSet: { projects: pid } });
export const removeProject = (id, pid) => model.updateOne({ _id: id }, { $pull: { projects: pid } });
