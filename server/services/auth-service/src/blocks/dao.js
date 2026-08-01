// blocks/dao.js
import { v4 as uuid } from "uuid";
import model from "./model.js";
import followModel from "../follows/model.js";

// on or off
export async function toggle(blocker, blocked) {
  if (!blocker || !blocked || blocker === blocked) return null;
  const found = await model.findOne({ blocker, blocked });
  if (found) {
    await model.deleteOne({ _id: found._id });
    return { blocked: false };
  }
  await model.create({ _id: uuid(), blocker, blocked });
  // drop any follow both ways
  await followModel.deleteMany({
    $or: [
      { follower: blocker, following: blocked },
      { follower: blocked, following: blocker },
    ],
  });
  return { blocked: true };
}

// did a block me or did i block a
export async function isBlocked(a, b) {
  if (!a || !b) return false;
  const row = await model.findOne({
    $or: [
      { blocker: a, blocked: b },
      { blocker: b, blocked: a },
    ],
  });
  return !!row;
}

export const listFor = (blocker) => model.find({ blocker }).sort({ createdAt: -1 });

// ids i cannot see and who cannot see me
export async function hiddenIds(me) {
  if (!me) return [];
  const rows = await model.find({ $or: [{ blocker: me }, { blocked: me }] }).select("blocker blocked");
  const set = new Set();
  for (const r of rows) set.add(r.blocker === me ? r.blocked : r.blocker);
  return [...set];
}
