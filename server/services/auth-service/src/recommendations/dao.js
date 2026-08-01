// recommendations/dao.js
import { v4 as uuid } from "uuid";
import model from "./model.js";

export async function create({ forUser, author, authorName, authorUsername, authorAvatar, text }) {
  if (!forUser || !author || !text || forUser === author) return null;
  return model.create({
    _id: uuid(),
    forUser,
    author,
    authorName: authorName || "",
    authorUsername: authorUsername || "",
    authorAvatar: authorAvatar || "",
    text: text.slice(0, 1000),
  });
}

export const listFor = (userId) => model.find({ forUser: userId }).sort({ createdAt: -1 }).limit(100);
export const findById = (id) => model.findById(id);
export const remove = (id) => model.deleteOne({ _id: id });
