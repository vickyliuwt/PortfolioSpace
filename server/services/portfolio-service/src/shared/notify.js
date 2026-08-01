// shared/notify.js
// write notice

import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

const schema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    user: { type: String, required: true, index: true }, // recipient
    type: { type: String, required: true }, // like | comment | save | follow
    actor: { type: String, default: "" },
    actorName: { type: String, default: "" },
    actorUsername: { type: String, default: "" },
    actorAvatar: { type: String, default: "" },
    project: { type: String, default: "" },
    projectTitle: { type: String, default: "" },
    text: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
  },
  { collection: "notifications", timestamps: true }
);

const model = mongoose.models.NotificationModel || mongoose.model("NotificationModel", schema);

// never throw — notifications are non-critical, no self-notify
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
    // ignore
  }
}

export default model;
