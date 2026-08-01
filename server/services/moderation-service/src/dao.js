// moderation/dao.js
import { v4 as uuid } from "uuid";
import model from "./model.js";
import mongoose from "mongoose";

// file a new report
export async function createReport({ reporter, reporterName, targetType, targetId, reason }) {
  if (!["project", "comment"].includes(targetType) || !targetId) return null;
  return model.create({
    _id: uuid(),
    reporter,
    reporterName: reporterName || "",
    targetType,
    targetId,
    reason: (reason || "").slice(0, 500),
    status: "OPEN",
  });
}

// queue
export function listReports(status = "OPEN") {
  const q = status && status !== "ALL" ? { status } : {};
  return model.find(q).sort({ createdAt: -1 }).limit(200);
}

export async function setStatus(id, status) {
  if (!["OPEN", "RESOLVED", "DISMISSED"].includes(status)) return null;
  await model.updateOne({ _id: id }, { $set: { status } });
  return model.findById(id);
}

// remove target
export async function removeTarget(targetType, targetId) {
  const coll = targetType === "project" ? "projects" : targetType === "comment" ? "comments" : null;
  if (!coll) return null;
  await mongoose.connection.collection(coll).deleteOne({ _id: targetId });
  await model.updateMany({ targetType, targetId }, { $set: { status: "RESOLVED" } });
  return true;
}

export const countOpen = () => model.countDocuments({ status: "OPEN" });
