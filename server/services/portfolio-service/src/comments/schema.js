// comments/schema.js
// feedback on a project

import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    project: { type: String, required: true, index: true },
    author: { type: String, required: true }, // userId
    authorName: { type: String, default: "" },
    authorUsername: { type: String, default: "" },
    authorAvatar: { type: String, default: "" },
    text: { type: String, required: [true, "say something"], maxlength: [500, "too long"] },
    parent: { type: String, default: "" }, // reply target (comment id), "" = top level
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    reactions: { type: [{ emoji: { type: String }, user: { type: String }, _id: false }], default: [] },
  },
  { collection: "comments", timestamps: true }
);

commentSchema.index({ project: 1, createdAt: -1 });

export default commentSchema;
