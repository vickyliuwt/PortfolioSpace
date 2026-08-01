// follows/dao.js
import { v4 as uuid } from "uuid";
import model from "./model.js";
import userModel from "../users/model.js";
import { publicView } from "../users/dao.js";

// follow if new, unfollow if already there
export async function toggle(follower, following) {
  const existing = await model.findOne({ follower, following });
  if (existing) {
    await model.deleteOne({ _id: existing._id });
    return { following: false };
  }
  await model.create({ _id: uuid(), follower, following });
  return { following: true };
}

export const isFollowing = async (a, b) => !!(await model.findOne({ follower: a, following: b }));

export async function followingIds(userId) {
  const rows = await model.find({ follower: userId }).select("following");
  return rows.map((r) => r.following);
}

export async function counts(userId) {
  const [followers, following] = await Promise.all([
    model.countDocuments({ following: userId }),
    model.countDocuments({ follower: userId }),
  ]);
  return { followers, following };
}

export async function followingUsers(userId) {
  const ids = await followingIds(userId);
  if (!ids.length) return [];
  const users = await userModel.find({ _id: { $in: ids } });
  return users.map(publicView);
}

export async function followerUsers(userId) {
  const rows = await model.find({ following: userId }).select("follower");
  const ids = rows.map((r) => r.follower);
  if (!ids.length) return [];
  const users = await userModel.find({ _id: { $in: ids } });
  return users.map(publicView);
}

// top creators
export async function creatorsRanked(limit = 60) {
  const rows = await model.aggregate([{ $group: { _id: "$following", followers: { $sum: 1 } } }]);
  const countBy = new Map(rows.map((r) => [r._id, r.followers]));
  const users = await userModel.find({}).limit(200);
  const ranked = users.map((u) => ({ ...publicView(u), followers: countBy.get(u._id) || 0 }));
  ranked.sort((a, b) => b.followers - a.followers);
  return ranked.slice(0, limit);
}
