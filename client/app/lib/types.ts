// lib/types.ts
// shared shapes

export interface Experience {
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface Education {
  school: string;
  degree: string;
  period: string;
}

export interface Creator {
  _id: string;
  username: string;
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl: string;
  skills: string[];
  experience?: Experience[];
  education?: Education[];
  openToWork?: boolean;
  privateAccount?: boolean;
  locked?: boolean;
  socials: { github: string; linkedin: string; dribbble: string; instagram: string };
  plan: "FREE" | "PRO";
  role?: "CREATOR" | "ADMIN";
  email?: string;
  createdAt?: string;
  followers?: number; // filled by the leaderboard
  notifyPrefs?: NotifyPrefs;
}

export interface NotifyPrefs {
  like: boolean;
  comment: boolean;
  save: boolean;
  follow: boolean;
  mention: boolean;
  message: boolean;
  collab: boolean;
}

export interface MediaItem {
  key: string;
  url: string;
  type: "image" | "video" | "gif" | "other";
  caption?: string;
  order?: number;
}

export interface Collaborator {
  user: string;
  username: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface Project {
  _id: string;
  owner: string;
  ownerUsername: string;
  ownerName: string;
  ownerAvatar?: string;
  collaborators?: Collaborator[];
  title: string;
  summary: string;
  description: string;
  category: string;
  tags: string[];
  tools: string[];
  coverUrl: string;
  coverKey: string;
  media: MediaItem[];
  externalUrl: string;
  repoUrl: string;
  demoUrl: string;
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
  status?: "PUBLISHED" | "DRAFT";
  role?: string;
  highlights?: string[];
  year?: string;
  kind?: "art" | "code" | "film" | "photo" | "music" | "writing" | "daily" | "other";
  likes: number;
  likedBy: string[];
  views: number;
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  _id: string;
  project: string;
  author: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  text: string;
  parent?: string;
  likes?: number;
  likedBy?: string[];
  reactions?: { emoji: string; user: string }[];
  createdAt?: string;
}

export interface ChatUser {
  userId: string;
  name: string;
  username: string;
  avatarUrl: string;
}

export interface MessageThread extends ChatUser {
  last: string;
  lastAt?: string;
  fromMe: boolean;
  unread: number;
}

export interface DirectMessage {
  _id: string;
  from: string;
  to: string;
  text: string;
  imageUrl?: string;
  imageKey?: string;
  audioUrl?: string;
  audioKey?: string;
  audioSecs?: number;
  sticker?: string;
  project?: { id: string; title: string; cover: string; owner: string } | null;
  read: boolean;
  createdAt?: string;
}

export interface FollowCounts {
  followers: number;
  following: number;
}

export interface AppNotification {
  _id: string;
  user: string;
  type: "like" | "comment" | "save" | "follow" | "reply" | "mention" | "message" | "collab";
  actor: string;
  actorName: string;
  actorUsername: string;
  actorAvatar?: string;
  project?: string;
  projectTitle?: string;
  text?: string;
  read: boolean;
  createdAt?: string;
}

export interface Collection {
  _id: string;
  owner: string;
  ownerUsername: string;
  ownerName: string;
  title: string;
  description: string;
  coverUrl: string;
  projects: string[];
  visibility: "PUBLIC" | "PRIVATE";
  createdAt?: string;
  updatedAt?: string;
}

// work types
export const KINDS = [
  { key: "art", emoji: "🎨", label: "Art", tile: "c-pink", blurb: "Illustration, painting, design" },
  { key: "code", emoji: "💻", label: "Code", tile: "c-sky", blurb: "Apps, ML, open source" },
  { key: "film", emoji: "🎬", label: "Film", tile: "c-caramel", blurb: "Short films, motion, animation" },
  { key: "photo", emoji: "📷", label: "Photo", tile: "c-mint", blurb: "Photography" },
  { key: "music", emoji: "🎵", label: "Music", tile: "c-sun", blurb: "Tracks, sound design" },
  { key: "writing", emoji: "✍️", label: "Writing", tile: "c-peach", blurb: "Articles, poems, essays" },
  { key: "daily", emoji: "📔", label: "Daily", tile: "c-pink", blurb: "Everyday plog / vlog notes" },
  { key: "other", emoji: "✨", label: "Other", tile: "c-peach", blurb: "Anything else" },
] as const;

export function kindMeta(key?: string) {
  return KINDS.find((k) => k.key === key) || KINDS[KINDS.length - 1];
}

// short counts
export function formatCount(n: number): string {
  if (!n || n < 1000) return String(n || 0);
  if (n < 1_000_000) {
    const v = n / 1000;
    return (v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")) + "k";
  }
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
}

// reactions
export const REACTIONS = ["❤️", "👍", "😆", "😮", "🎉", "🔥"];

// stickers
export const STICKERS = ["🐾", "💕", "😂", "😍", "👍", "🎉", "🔥", "😭", "🥺", "👀", "💯", "✨", "🙏", "😎", "🤗", "🐶"];

// type to categories
export const CATEGORIES_BY_KIND: Record<string, string[]> = {
  art: ["Illustration", "Painting", "Drawing", "Digital Art", "Concept Art", "Character Design", "Comic", "UI/UX", "Branding", "3D"],
  code: ["Web App", "Mobile App", "Backend/API", "Machine Learning", "Data Viz", "Game", "Open Source", "DevTool", "Library", "CLI Tool"],
  film: ["Animation", "Motion", "Short Film", "Music Video", "Documentary", "VFX", "Reel"],
  photo: ["Photography", "Portrait", "Landscape", "Street", "Product", "Travel", "Film Photo"],
  music: ["Original Track", "Beat", "Sound Design", "Cover", "Remix", "Podcast"],
  writing: ["Article", "Essay", "Poetry", "Short Story", "Blog", "Tutorial"],
  daily: ["Vlog", "Photo Diary", "Day in the Life", "Travel Log", "Food", "Lifestyle", "Study"],
  other: ["Other"],
};

// type categories
export function categoriesForKind(kind?: string): string[] {
  return CATEGORIES_BY_KIND[kind || "other"] || ["Other"];
}

// all categories
export const CATEGORIES: string[] = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of Object.values(CATEGORIES_BY_KIND)) {
    for (const c of list) {
      if (c !== "Other" && !seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
    }
  }
  out.push("Other");
  return out;
})();

// filter groups
export const CATEGORY_GROUPS: Record<string, string[]> = {
  All: [],
  Art: ["Animation", "Illustration", "Motion", "3D", "Photography", "Branding"],
  Engineering: ["Web App", "Mobile App", "Backend/API", "Machine Learning", "Data Viz", "Game", "Open Source", "DevTool"],
  Design: ["UI/UX", "Branding"],
};
