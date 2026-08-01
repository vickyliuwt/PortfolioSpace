import mongoose from "mongoose";
import endorsementSchema from "./schema.js";
export default mongoose.models.Endorsement || mongoose.model("Endorsement", endorsementSchema);
