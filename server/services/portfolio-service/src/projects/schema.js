// projects/schema.js
// project row

import mongoose from "mongoose";

// one media item = one file in storage
const mediaItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // storage key
    url: { type: String, default: "" }, // cached url
    type: { type: String, enum: ["image", "video", "gif", "other"], default: "image" },
    caption: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

// one credited teammate
const collaboratorSchema = new mongoose.Schema(
  {
    user: { type: String, required: true }, // user id
    username: { type: String, default: "" },
    name: { type: String, default: "" },
    avatar: { type: String, default: "" },
    role: { type: String, default: "", maxlength: 60 }, // what they did
  },
  { _id: false }
);

// one saved edit
const versionSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    title: { type: String, default: "" },
    summary: { type: String, default: "" },
    description: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    category: { type: String, default: "" },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },

    // owner (from auth-service)
    owner: { type: String, required: true, index: true },
    ownerUsername: { type: String, default: "" },
    ownerName: { type: String, default: "" },
    ownerAvatar: { type: String, default: "" },

    // credited teammates
    collaborators: { type: [collaboratorSchema], default: [] },

    // basics
    title: {
      type: String,
      required: [true, "title needed"],
      trim: true,
      maxlength: [120, "title too long"],
    },
    summary: { type: String, default: "", maxlength: [280, "summary too long"] },
    description: { type: String, default: "" },

    // categories
    category: {
      type: String,
      enum: [
        "Animation", "Illustration", "UI/UX", "Motion", "3D", "Photography", "Branding",
        "Web App", "Mobile App", "Backend/API", "Machine Learning", "Data Viz", "Game", "Open Source", "DevTool",
        "Other",
      ],
      default: "Other",
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    tools: { type: [String], default: [] }, // software / tech stack

    // cover + gallery
    coverKey: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    media: { type: [mediaItemSchema], default: [] },

    // links (behance, youtube, repo, live demo...)
    externalUrl: { type: String, default: "" },
    repoUrl: { type: String, default: "" }, // github / gitlab
    demoUrl: { type: String, default: "" }, // live site

    // who can see it
    visibility: { type: String, enum: ["PUBLIC", "FRIENDS", "PRIVATE"], default: "PUBLIC", index: true },
    status: { type: String, enum: ["PUBLISHED", "DRAFT"], default: "PUBLISHED", index: true },
    role: { type: String, default: "", trim: true },
    highlights: { type: [String], default: [] },
    year: { type: String, default: "", trim: true },
    versions: { type: [versionSchema], default: [] },
    kind: { type: String, enum: ["art", "code", "film", "photo", "music", "writing", "daily", "other"], default: "other", index: true },

    // engagement
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    views: { type: Number, default: 0 },

    // featured flag
    featured: { type: Boolean, default: false },
  },
  { collection: "projects", timestamps: true }
);

// keyword search across the important text
projectSchema.index({ title: "text", summary: "text", description: "text", tags: "text" });
projectSchema.index({ visibility: 1, createdAt: -1 });
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ "collaborators.user": 1 });

export default projectSchema;
