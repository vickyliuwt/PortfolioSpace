// endorsements/schema.js
// skill endorse
import mongoose from "mongoose";

const endorsementSchema = new mongoose.Schema(
  {
    _id: { type: String },
    owner: { type: String, required: true, index: true },
    skill: { type: String, required: true },
    endorser: { type: String, required: true },
  },
  { collection: "endorsements", timestamps: true }
);
endorsementSchema.index({ owner: 1, skill: 1, endorser: 1 }, { unique: true });

export default endorsementSchema;
