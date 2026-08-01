// saves/model.js
import mongoose from "mongoose";
import schema from "./schema.js";

const model = mongoose.models.SaveModel || mongoose.model("SaveModel", schema);
export default model;
