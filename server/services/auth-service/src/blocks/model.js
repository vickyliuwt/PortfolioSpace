// blocks/model.js
import mongoose from "mongoose";
import blockSchema from "./schema.js";
export default mongoose.models.Block || mongoose.model("Block", blockSchema);
