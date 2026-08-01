// messages/schema.js
// one dm

import mongoose from "mongoose";

// shared card
const msgProjectSchema = new mongoose.Schema(
  {
    id: { type: String },
    title: { type: String },
    cover: { type: String },
    owner: { type: String },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    text: { type: String, default: "", maxlength: [2000, "too long"] },
    imageUrl: { type: String, default: "" },
    imageKey: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    audioKey: { type: String, default: "" },
    audioSecs: { type: Number, default: 0 },
    sticker: { type: String, default: "" },
    project: { type: msgProjectSchema, default: null },
    read: { type: Boolean, default: false },
  },
  { collection: "messages", timestamps: true }
);

messageSchema.index({ from: 1, to: 1, createdAt: 1 });
messageSchema.index({ to: 1, read: 1 }); // unread counts

export default messageSchema;
