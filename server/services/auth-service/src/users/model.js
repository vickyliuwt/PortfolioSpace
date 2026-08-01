// users/model.js
import mongoose from "mongoose";
import schema from "./schema.js";

const model = mongoose.models.UserModel || mongoose.model("UserModel", schema);
export default model;
