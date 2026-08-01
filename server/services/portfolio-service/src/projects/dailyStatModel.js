// projects/dailyStatModel.js
// daily bucket

import mongoose from "mongoose";

const dailyStatSchema = new mongoose.Schema(
  {
    _id: { type: String }, // `${owner}:${day}`
    owner: { type: String, required: true, index: true },
    day: { type: String, required: true }, // YYYY-MM-DD (UTC)
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  },
  { collection: "dailystats", timestamps: true }
);

dailyStatSchema.index({ owner: 1, day: 1 }, { unique: true });

export default mongoose.models.DailyStat || mongoose.model("DailyStat", dailyStatSchema);
