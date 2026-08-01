// users/schema.js
// creator account + profile

import mongoose from "mongoose";

const socialSchema = new mongoose.Schema(
  {
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    dribbble: { type: String, default: "" },
    instagram: { type: String, default: "" },
  },
  { _id: false }
);

// per-type notification switches (all on by default)
const experienceSchema = new mongoose.Schema(
  {
    role: { type: String, default: "" },
    company: { type: String, default: "" },
    period: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    school: { type: String, default: "" },
    degree: { type: String, default: "" },
    period: { type: String, default: "" },
  },
  { _id: false }
);

const notifyPrefsSchema = new mongoose.Schema(
  {
    like: { type: Boolean, default: true },
    comment: { type: Boolean, default: true },
    save: { type: Boolean, default: true },
    follow: { type: Boolean, default: true },
    mention: { type: Boolean, default: true },
    message: { type: Boolean, default: true },
    collab: { type: Boolean, default: true },
  },
  { _id: false, suppressReservedKeysWarning: true }
);

const userSchema = new mongoose.Schema(
  {
    // id
    _id: { type: String, required: true },

    // login
    username: {
      type: String,
      required: [true, "username needed"],
      trim: true,
      lowercase: true,
      minlength: [3, "min 3 chars"],
      maxlength: [30, "max 30 chars"],
      match: [/^[a-z0-9_]+$/, "letters, numbers and _ only"],
    },
    password: { type: String, required: [true, "password needed"] },

    email: {
      type: String,
      required: [true, "email needed"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "bad email"],
    },

    // profile
    displayName: { type: String, trim: true, default: "" },
    headline: { type: String, trim: true, default: "Creative maker" },
    bio: { type: String, default: "", maxlength: [600, "bio too long"] },
    location: { type: String, default: "" },
    website: { type: String, default: "" },

    // avatar
    avatarKey: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },

    // discovery
    skills: { type: [String], default: [] },
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    openToWork: { type: Boolean, default: false },
    privateAccount: { type: Boolean, default: false },
    socials: { type: socialSchema, default: () => ({}) },

    // role
    role: {
      type: String,
      enum: ["CREATOR", "ADMIN"],
      default: "CREATOR",
      uppercase: true,
    },

    // free, pro extra
    plan: {
      type: String,
      enum: ["FREE", "PRO"],
      default: "FREE",
      uppercase: true,
    },

    lastLogin: { type: String, default: () => new Date().toISOString() },

    // notification preferences
    notifyPrefs: { type: notifyPrefsSchema, default: () => ({}) },
  },
  { collection: "users", timestamps: true }
);

// search + unique
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ skills: 1 });
userSchema.index({ displayName: "text", headline: "text", bio: "text" });

// hide password
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

// tidy fields (mongoose 9: hooks are async, no next callback)
userSchema.pre("save", async function () {
  if (this.username) this.username = this.username.trim().toLowerCase();
  if (this.email) this.email = this.email.trim().toLowerCase();
  if (!this.displayName) this.displayName = this.username;
});

export default userSchema;
