// badges.ts
// small awards worked out from what someone already has

import type { Creator, Project } from "./types";

export interface Badge {
  key: string;
  emoji: string;
  label: string;
  note: string;
}

export function badgesFor(creator: Creator, projects: Project[], followers: number): Badge[] {
  const out: Badge[] = [];
  const likes = projects.reduce((n, p) => n + (p.likes || 0), 0);
  const views = projects.reduce((n, p) => n + (p.views || 0), 0);
  const kinds = new Set(projects.map((p) => p.kind || "other"));
  const hasRepo = projects.some((p) => p.repoUrl);
  const joined = creator.createdAt ? new Date(creator.createdAt) : null;
  const months = joined ? (Date.now() - joined.getTime()) / (1000 * 60 * 60 * 24 * 30) : 0;

  if (projects.length >= 10) out.push({ key: "prolific", emoji: "🏗️", label: "Prolific", note: "10 or more posts" });
  else if (projects.length >= 3) out.push({ key: "started", emoji: "🌱", label: "Getting going", note: "3 or more posts" });

  if (likes >= 100) out.push({ key: "loved", emoji: "💖", label: "Well loved", note: "100+ likes" });
  else if (likes >= 25) out.push({ key: "liked", emoji: "💗", label: "Liked", note: "25+ likes" });

  if (views >= 500) out.push({ key: "seen", emoji: "👀", label: "Seen a lot", note: "500+ views" });
  if (followers >= 25) out.push({ key: "popular", emoji: "⭐", label: "Popular", note: "25+ followers" });
  if (kinds.size >= 3) out.push({ key: "range", emoji: "🎭", label: "Range", note: "3+ kinds of work" });
  if (hasRepo) out.push({ key: "builder", emoji: "💻", label: "Builder", note: "shares code" });
  if (creator.experience && creator.experience.length > 0) out.push({ key: "pro", emoji: "🧰", label: "Has history", note: "listed experience" });
  if (months >= 6) out.push({ key: "regular", emoji: "🕰️", label: "Regular", note: "6+ months here" });
  if (creator.openToWork) out.push({ key: "hiring", emoji: "✅", label: "Open to work", note: "looking for work" });

  return out;
}
