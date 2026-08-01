// blocks/schema.js
// one person blocking another

import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
  {
    _id: { type: String },
    blocker: { type: String, required: true, index: true },
    blocked: { type: String, required: true, index: true },
  },
  { collection: "blocks", timestamps: true }
);
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export default blockSchema;
