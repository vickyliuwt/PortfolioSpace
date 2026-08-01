// saves/schema.js
// save row

import mongoose from "mongoose";

const saveSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    user: { type: String, required: true, index: true }, // owner of the bookmark
    project: { type: String, required: true, index: true },
  },
  { collection: "saves", timestamps: true }
);

// one save
saveSchema.index({ user: 1, project: 1 }, { unique: true });

export default saveSchema;
