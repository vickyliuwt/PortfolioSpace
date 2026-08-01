// profileviews/dao.js
import { v4 as uuid } from "uuid";
import model from "./model.js";

// bump one viewer
export async function record(owner, viewer) {
  if (!owner || !viewer || owner === viewer._id) return null;
  await model.updateOne(
    { owner, viewer: viewer._id },
    {
      $set: {
        lastAt: new Date(),
        viewerName: viewer.displayName || viewer.username || "",
        viewerUsername: viewer.username || "",
        viewerAvatar: viewer.avatarUrl || "",
        viewerHeadline: viewer.headline || "",
      },
      $inc: { count: 1 },
      $setOnInsert: { _id: uuid() },
    },
    { upsert: true }
  );
  return true;
}

// recent visitors
export const recent = (owner, limit = 20) => model.find({ owner }).sort({ lastAt: -1 }).limit(limit);
export const total = (owner) => model.countDocuments({ owner });
