// messages/dao.js
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import model from "./model.js";

export async function send(from, to, { text = "", imageUrl = "", imageKey = "", audioUrl = "", audioKey = "", audioSecs = 0, sticker = "", project = null } = {}) {
  return model.create({ _id: uuid(), from, to, text, imageUrl, imageKey, audioUrl, audioKey, audioSecs, sticker, project, read: false });
}

// typing flag
// in memory on purpose, it is throwaway state. swept so it cannot grow forever
const typingMap = new Map();
const TYPING_MS = 6000;

function sweepTyping() {
  const now = Date.now();
  for (const [k, until] of typingMap) {
    if (until <= now) typingMap.delete(k);
  }
}

export function setTyping(from, to) {
  if (typingMap.size > 500) sweepTyping();
  typingMap.set(`${from}:${to}`, Date.now() + TYPING_MS);
}
// typing check
export function isTyping(other, me) {
  const key = `${other}:${me}`;
  const until = typingMap.get(key);
  if (!until) return false;
  if (until <= Date.now()) {
    typingMap.delete(key); // expired, drop it
    return false;
  }
  return true;
}

// full conversation between two people (oldest first)
export const conversation = (a, b) =>
  model.find({ $or: [{ from: a, to: b }, { from: b, to: a }] }).sort({ createdAt: 1 });

export const markRead = (me, other) =>
  model.updateMany({ from: other, to: me, read: false }, { $set: { read: true } });

export const unreadTotal = (me) => model.countDocuments({ to: me, read: false });

export const findById = (id) => model.findById(id);
export const remove = (id) => model.deleteOne({ _id: id });

// list conversations: newest message per person + unread count + their profile
export async function threads(userId) {
  const msgs = await model.find({ $or: [{ from: userId }, { to: userId }] }).sort({ createdAt: -1 });
  const map = new Map();
  for (const m of msgs) {
    const other = m.from === userId ? m.to : m.from;
    if (!map.has(other)) {
      map.set(other, { userId: other, last: m.text || (m.sticker ? m.sticker : m.imageUrl ? "Photo" : m.audioUrl ? "Voice message" : m.project ? m.project.title || "Project" : ""), lastAt: m.createdAt, fromMe: m.from === userId, unread: 0 });
    }
    if (m.to === userId && !m.read) map.get(other).unread += 1;
  }
  const others = [...map.keys()];
  if (others.length) {
    const users = await mongoose.connection.collection("users").find({ _id: { $in: others } }).toArray();
    const byId = new Map(users.map((u) => [u._id, u]));
    for (const t of map.values()) {
      const u = byId.get(t.userId);
      t.name = u?.displayName || u?.username || "user";
      t.username = u?.username || "";
      t.avatarUrl = u?.avatarUrl || "";
    }
  }
  return [...map.values()];
}

// resolve a user card by id (for opening a fresh conversation)
export async function userCard(id) {
  const u = await mongoose.connection.collection("users").findOne({ _id: id });
  if (!u) return null;
  return { userId: u._id, name: u.displayName || u.username, username: u.username, avatarUrl: u.avatarUrl || "" };
}
