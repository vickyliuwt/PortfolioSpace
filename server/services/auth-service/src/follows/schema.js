// follows/schema.js
// one row = follower follows following

import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    follower: { type: String, required: true, index: true },
    following: { type: String, required: true, index: true },
  },
  { collection: "follows", timestamps: true }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });

export default followSchema;
