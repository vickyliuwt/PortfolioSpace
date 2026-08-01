// follows/model.js
import mongoose from "mongoose";
import schema from "./schema.js";

const model = mongoose.models.FollowModel || mongoose.model("FollowModel", schema);
export default model;
