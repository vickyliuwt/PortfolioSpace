// lib/format.ts
// tiny pure helpers (easy to unit test)

import { kindMeta } from "./types";

// cut long text, add ellipsis
export function truncate(text: string, max: number): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// category -> pill colour class
// only the six classes in globals.css are valid: pink sun sky mint caramel peach
const TILE_BY_CATEGORY: Record<string, string> = {
  // art
  Illustration: "c-pink",
  Painting: "c-peach",
  Drawing: "c-sun",
  "Digital Art": "c-pink",
  "Concept Art": "c-caramel",
  "Character Design": "c-pink",
  Comic: "c-sun",
  "UI/UX": "c-sky",
  Branding: "c-caramel",
  "3D": "c-mint",

  // code
  "Web App": "c-sky",
  "Mobile App": "c-mint",
  "Backend/API": "c-caramel",
  "Machine Learning": "c-pink",
  "Data Viz": "c-sun",
  Game: "c-peach",
  "Open Source": "c-mint",
  DevTool: "c-sky",
  Library: "c-sky",
  "CLI Tool": "c-caramel",

  // film
  Animation: "c-pink",
  Motion: "c-pink",
  "Short Film": "c-caramel",
  "Music Video": "c-sun",
  Documentary: "c-mint",
  VFX: "c-sky",
  Reel: "c-peach",

  // photo
  Photography: "c-sky",
  Portrait: "c-peach",
  Landscape: "c-mint",
  Street: "c-caramel",
  Product: "c-sun",
  Travel: "c-sky",
  "Film Photo": "c-mint",

  // music
  "Original Track": "c-sun",
  Beat: "c-sun",
  "Sound Design": "c-caramel",
  Cover: "c-peach",
  Remix: "c-pink",
  Podcast: "c-sky",

  // writing
  Article: "c-peach",
  Essay: "c-peach",
  Poetry: "c-pink",
  "Short Story": "c-caramel",
  Blog: "c-sun",
  Tutorial: "c-sky",

  // daily
  Vlog: "c-pink",
  "Photo Diary": "c-peach",
  "Day in the Life": "c-sun",
  "Travel Log": "c-sky",
  Food: "c-caramel",
  Lifestyle: "c-mint",
  Study: "c-mint",

  Other: "c-peach",
};

// a new category should still look like its work type, not fall to grey
export function catTile(category: string, kind?: string): string {
  return TILE_BY_CATEGORY[category] || kindMeta(kind).tile;
}
