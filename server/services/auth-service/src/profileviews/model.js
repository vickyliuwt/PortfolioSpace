// profileviews/model.js
import mongoose from "mongoose";
import viewSchema from "./schema.js";
export default mongoose.models.ProfileView || mongoose.model("ProfileView", viewSchema);
