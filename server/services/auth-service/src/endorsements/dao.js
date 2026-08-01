// endorsements/dao.js
import { v4 as uuid } from "uuid";
import model from "./model.js";

export async function toggle(owner, skill, endorser) {
  if (!owner || !skill || !endorser || owner === endorser) return null;
  const existing = await model.findOne({ owner, skill, endorser });
  if (existing) await model.deleteOne({ _id: existing._id });
  else await model.create({ _id: uuid(), owner, skill, endorser });
  const count = await model.countDocuments({ owner, skill });
  return { endorsed: !existing, count };
}

// counts
export async function countsFor(owner, viewer) {
  const rows = await model.find({ owner }).select("skill endorser");
  const out = {};
  for (const r of rows) {
    if (!out[r.skill]) out[r.skill] = { count: 0, mine: false };
    out[r.skill].count += 1;
    if (viewer && r.endorser === viewer) out[r.skill].mine = true;
  }
  return out;
}
