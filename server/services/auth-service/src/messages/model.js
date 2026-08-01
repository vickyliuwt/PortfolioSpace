// messages/model.js
import mongoose from "mongoose";
import schema from "./schema.js";

const model = mongoose.models.MessageModel || mongoose.model("MessageModel", schema);
export default model;
