// notifications/schema.js
// shared "notifications" collection (written by auth + portfolio)

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
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

// list newest-first per recipient, and count unread fast
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

export default notificationSchema;
