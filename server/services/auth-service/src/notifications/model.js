// notifications/model.js
import mongoose from "mongoose";
import schema from "./schema.js";

const model = mongoose.models.NotificationModel || mongoose.model("NotificationModel", schema);
export default model;
