// search.ts
// es then mongo

import api from "./api";
import { discover } from "../(portfolio)/Projects/client";
import type { Project } from "./types";

const S = "/search";

export interface EsHit {
  id: string;
  score?: number;
  title: string;
  summary?: string;
  ownerUsername?: string;
  coverUrl?: string;
  kind?: string;
  category?: string;
  likes?: number;
  views?: number;
  highlight?: Record<string, string[]>;
}

export interface MsgHit {
  id: string;
  text: string;
  from: string;
  to: string;
  createdAt?: string;
  highlight?: Record<string, string[]>;
}

// work search
export async function searchProjects(q: string, kind = "All", category = "All"): Promise<{ engine: "elasticsearch" | "mongo"; items: Project[] }> {
  try {
    const res = await api.get(`${S}/projects`, { params: { q, kind, category } });
    if (res.data?.es && Array.isArray(res.data.hits)) {
      const items: Project[] = res.data.hits.map((h: EsHit) => ({
        _id: h.id,
        owner: "",
        ownerUsername: h.ownerUsername || "",
        ownerName: "",
        title: h.title,
        summary: h.summary || "",
        description: "",
        category: h.category || "",
        tags: [],
        tools: [],
        coverUrl: h.coverUrl || "",
        coverKey: "",
        media: [],
        externalUrl: "",
        visibility: "PUBLIC",
        kind: (h.kind || "other") as Project["kind"],
        likes: h.likes || 0,
        likedBy: [],
        views: h.views || 0,
        featured: false,
      })) as Project[];
      return { engine: "elasticsearch", items };
    }
  } catch {
    // fall through
  }
  const items = await discover({ q, kind, category }).catch(() => [] as Project[]);
  return { engine: "mongo", items };
}

// chat search
export async function searchMessages(q: string): Promise<{ engine: "elasticsearch" | "off"; items: MsgHit[] }> {
  try {
    const res = await api.get(`${S}/messages`, { params: { q } });
    if (res.data?.es) return { engine: "elasticsearch", items: res.data.hits || [] };
  } catch {
    // ignore
  }
  return { engine: "off", items: [] };
}

// reindex
export async function reindexSearch(fresh = false): Promise<{ projects?: number; messages?: number; message?: string }> {
  const res = await api.post(`${S}/reindex`, { fresh });
  return res.data;
}

// status
export async function searchHealth(): Promise<{ elasticsearch?: string; esVersion?: string | null }> {
  const res = await api.get(`${S}/health`).catch(() => ({ data: {} }));
  return res.data || {};
}
