// moderation/model.js
import mongoose from "mongoose";
import reportSchema from "./schema.js";

export default mongoose.models.Report || mongoose.model("Report", reportSchema);
