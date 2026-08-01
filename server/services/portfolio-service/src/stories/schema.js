// stories/schema.js
// 24h stories

import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    _id: { type: String },
    owner: { type: String, required: true, index: true },
    ownerUsername: { type: String, default: "" },
    ownerName: { type: String, default: "" },
    ownerAvatar: { type: String, default: "" },
    imageUrl: { type: String, required: true },
    imageKey: { type: String, default: "" },
    caption: { type: String, default: "", maxlength: 200 },
    poll: {
      type: {
        kind: { type: String, enum: ["poll", "question"], default: "poll" },
        question: { type: String, default: "" },
        options: { type: [String], default: [] },
      },
      default: null,
    },
    votes: { type: [{ option: { type: Number }, user: { type: String }, text: { type: String, default: "" }, _id: false }], default: [] },
    expiresAt: { type: Date, required: true },
  },
  { collection: "stories", timestamps: true }
);

// auto expire
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ owner: 1, createdAt: 1 });

export default storySchema;
