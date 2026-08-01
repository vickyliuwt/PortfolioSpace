import mongoose from "mongoose";
import recommendationSchema from "./schema.js";
export default mongoose.models.Recommendation || mongoose.model("Recommendation", recommendationSchema);
