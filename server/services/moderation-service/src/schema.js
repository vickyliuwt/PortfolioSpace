// moderation/schema.js
// report row

import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    _id: { type: String },
    reporter: { type: String, required: true },
    reporterName: { type: String, default: "" },
    targetType: { type: String, enum: ["project", "comment"], required: true },
    targetId: { type: String, required: true },
    reason: { type: String, default: "", maxlength: 500 },
    status: { type: String, enum: ["OPEN", "RESOLVED", "DISMISSED"], default: "OPEN", index: true },
  },
  { collection: "reports", timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

export default reportSchema;
