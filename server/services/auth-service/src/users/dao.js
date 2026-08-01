// users/dao.js
// db ops for creators

import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import model from "./model.js";

// make account
export async function createUser(data) {
  const exists = await model.findOne({
    $or: [{ username: data.username?.toLowerCase() }, { email: data.email?.toLowerCase() }],
  });
  if (exists) throw Object.assign(new Error("username or email taken"), { statusCode: 409 });

  // hash password
  const hash = await bcrypt.hash(data.password, 10);

  const doc = {
    _id: uuid(),
    username: data.username,
    password: hash,
    email: data.email,
    displayName: data.displayName || data.username,
    headline: data.headline || "Creative maker",
    bio: data.bio || "",
    location: data.location || "",
    skills: Array.isArray(data.skills) ? data.skills : [],
    role: data.role === "ADMIN" ? "ADMIN" : "CREATOR",
    plan: "FREE",
  };

  return model.create(doc);
}

// check login
export async function verifyCredentials(username, password) {
  const user = await model.findOne({ username: username?.trim().toLowerCase() });
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  // stamp last login without a full save (no hooks / revalidation)
  const stamp = new Date().toISOString();
  await model.updateOne({ _id: user._id }, { $set: { lastLogin: stamp } });
  user.lastLogin = stamp;
  return user;
}

export const findById = (id) => model.findById(id);

export const findByUsername = (u) => model.findOne({ username: u?.trim().toLowerCase() });

// update profile (never touch password here)
export async function updateProfile(id, updates) {
  const clean = { ...updates };
  delete clean.password;
  delete clean._id;
  delete clean.role;
  delete clean.plan;

  await model.updateOne({ _id: id }, { $set: clean });
  return model.findById(id);
}

// change avatar key + url
export async function setAvatar(id, key, url) {
  await model.updateOne({ _id: id }, { $set: { avatarKey: key, avatarUrl: url } });
  return model.findById(id);
}

// upgrade / downgrade tier
export async function setPlan(id, plan) {
  await model.updateOne({ _id: id }, { $set: { plan: plan === "PRO" ? "PRO" : "FREE" } });
  return model.findById(id);
}

// change password
export async function changePassword(id, currentPw, newPw) {
  const user = await model.findById(id);
  if (!user) return { ok: false, reason: "account not found" };
  const ok = await bcrypt.compare(currentPw, user.password);
  if (!ok) return { ok: false, reason: "current password is wrong" };
  const hash = await bcrypt.hash(newPw, 10);
  await model.updateOne({ _id: id }, { $set: { password: hash } });
  return { ok: true };
}

// creator search
export async function searchCreators(term) {
  if (!term || !term.trim()) {
    return model.find().sort({ createdAt: -1 }).limit(60);
  }
  const rx = new RegExp(term.trim(), "i");
  return model
    .find({
      $or: [
        { username: rx },
        { displayName: rx },
        { headline: rx },
        { skills: rx },
      ],
    })
    .limit(60);
}

// public creator card (no private stuff)
export function publicView(user) {
  if (!user) return null;
  const u = user.toJSON ? user.toJSON() : user;
  return {
    _id: u._id,
    username: u.username,
    displayName: u.displayName,
    headline: u.headline,
    bio: u.bio,
    location: u.location,
    website: u.website,
    avatarUrl: u.avatarUrl,
    skills: u.skills,
    socials: u.socials,
    plan: u.plan,
    createdAt: u.createdAt,
  };
}

// simple validation
export function validate(data) {
  const errors = [];
  if (!data.username || data.username.trim().length < 3) errors.push("username min 3 chars");
  if (data.username && !/^[a-zA-Z0-9_]+$/.test(data.username)) errors.push("username bad chars");
  if (!data.password || data.password.length < 6) errors.push("password min 6 chars");
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) errors.push("email invalid");
  return { ok: errors.length === 0, errors };
}
