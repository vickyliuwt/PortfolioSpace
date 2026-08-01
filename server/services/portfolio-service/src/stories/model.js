// stories/model.js
import mongoose from "mongoose";
import storySchema from "./schema.js";

export default mongoose.models.Story || mongoose.model("Story", storySchema);
