// comments/model.js
import mongoose from "mongoose";
import schema from "./schema.js";
const model = mongoose.models.CommentModel || mongoose.model("CommentModel", schema);
export default model;
