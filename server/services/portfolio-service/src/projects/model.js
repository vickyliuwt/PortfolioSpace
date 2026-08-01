// projects/model.js
import mongoose from "mongoose";
import schema from "./schema.js";

const model = mongoose.models.ProjectModel || mongoose.model("ProjectModel", schema);
export default model;
