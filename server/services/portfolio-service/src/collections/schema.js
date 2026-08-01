// collections/schema.js
// board

import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    owner: { type: String, required: true, index: true },
    ownerUsername: { type: String, default: "" },
    ownerName: { type: String, default: "" },
    title: { type: String, required: [true, "title needed"], trim: true, maxlength: [100, "title too long"] },
    description: { type: String, default: "", maxlength: [400, "too long"] },
    coverUrl: { type: String, default: "" },
    projects: { type: [String], default: [] }, // project ids
    visibility: { type: String, enum: ["PUBLIC", "PRIVATE"], default: "PUBLIC", index: true },
  },
  { collection: "collections", timestamps: true }
);

export default collectionSchema;
