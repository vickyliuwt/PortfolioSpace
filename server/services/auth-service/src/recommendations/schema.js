// recommendations/schema.js — a written recommendation for a user
import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
  {
    _id: { type: String },
    forUser: { type: String, required: true, index: true },
    author: { type: String, required: true },
    authorName: { type: String, default: "" },
    authorUsername: { type: String, default: "" },
    authorAvatar: { type: String, default: "" },
    text: { type: String, required: true, maxlength: [1000, "too long"] },
  },
  { collection: "recommendations", timestamps: true }
);
recommendationSchema.index({ forUser: 1, createdAt: -1 });

export default recommendationSchema;
