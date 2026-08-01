// profileviews/schema.js
// who opened whose profile

import mongoose from "mongoose";

const viewSchema = new mongoose.Schema(
  {
    _id: { type: String },
    owner: { type: String, required: true, index: true },
    viewer: { type: String, required: true },
    viewerName: { type: String, default: "" },
    viewerUsername: { type: String, default: "" },
    viewerAvatar: { type: String, default: "" },
    viewerHeadline: { type: String, default: "" },
    lastAt: { type: Date, default: Date.now },
    count: { type: Number, default: 1 },
  },
  { collection: "profileviews", timestamps: true }
);
viewSchema.index({ owner: 1, viewer: 1 }, { unique: true });
viewSchema.index({ owner: 1, lastAt: -1 });

export default viewSchema;
