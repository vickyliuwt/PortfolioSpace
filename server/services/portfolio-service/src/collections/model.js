// collections/model.js
import mongoose from "mongoose";
import schema from "./schema.js";

const model = mongoose.models.CollectionModel || mongoose.model("CollectionModel", schema);
export default model;
