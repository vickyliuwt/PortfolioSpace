// notifications/dao.js
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import model from "./model.js";

// create
export async function notify(data) {
  try {
    if (!data.user || data.user === data.actor) return;
    // one lookup for both people: the recipient's prefs and the actor's avatar
    const ids = data.actor ? [data.user, data.actor] : [data.user];
    const rows = await mongoose.connection
      .collection("users")
      .find({ _id: { $in: ids } }, { projection: { notifyPrefs: 1, avatarUrl: 1 } })
      .toArray();
    const recip = rows.find((u) => u._id === data.user);
    if (recip && recip.notifyPrefs && recip.notifyPrefs[data.type] === false) return;

    // fill the avatar here so no caller has to remember it
    if (!data.actorAvatar && data.actor) {
      const who = rows.find((u) => u._id === data.actor);
      if (who && who.avatarUrl) data.actorAvatar = who.avatarUrl;
    }

    // nothing gets through between people who blocked each other
    if (data.actor) {
      const wall = await mongoose.connection.collection("blocks").findOne({
        $or: [
          { blocker: data.user, blocked: data.actor },
          { blocker: data.actor, blocked: data.user },
        ],
      });
      if (wall) return;
    }
    await model.create({ _id: uuid(), read: false, ...data });
  } catch {
    // notifications are non-critical
  }
}

export const listFor = (userId) => model.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
export const unreadCount = (userId) => model.countDocuments({ user: userId, read: false });
export const markAll = (userId) => model.updateMany({ user: userId, read: false }, { $set: { read: true } });
export const markOne = (userId, id) => model.updateOne({ _id: id, user: userId }, { $set: { read: true } });
