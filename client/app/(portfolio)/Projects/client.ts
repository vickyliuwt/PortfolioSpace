// Projects/client.ts
// project api

import api from "../../lib/api";
import type { Project, Comment, Collection } from "../../lib/types";

const P = "/projects";
const C = "/projects/comments"; // rides the projects proxy (reliable)

export interface DiscoverParams {
  q?: string;
  kind?: string;
  category?: string;
  tag?: string;
  sort?: "new" | "popular" | "views";
  page?: number;
  limit?: number;
}

// ---- discover (public) ----
export async function discover(params: DiscoverParams = {}): Promise<Project[]> {
  const res = await api.get(`${P}/discover`, { params });
  return res.data;
}

export async function similarProjects(id: string): Promise<Project[]> {
  const res = await api.get(`${P}/${id}/similar`);
  return res.data;
}

// short-video "reels" feed
export async function reels(): Promise<Project[]> {
  const res = await api.get(`${P}/reels`);
  return res.data;
}

export async function featured(): Promise<Project[]> {
  const res = await api.get(`${P}/featured`);
  return res.data;
}

export async function allTags(): Promise<string[]> {
  const res = await api.get(`${P}/tags`);
  return res.data;
}

// ---- mine ----
export async function myProjects(): Promise<Project[]> {
  const res = await api.get(`${P}/mine`);
  return res.data;
}

export async function myStats(): Promise<{ total: number; public: number; drafts?: number; likes: number; views: number }> {
  const res = await api.get(`${P}/mine/stats`);
  return res.data;
}

export async function myTrend(days = 30): Promise<{ day: string; views: number; likes: number }[]> {
  const res = await api.get(`${P}/mine/trend`, { params: { days } });
  return res.data;
}

export async function byCreator(ownerId: string): Promise<Project[]> {
  const res = await api.get(`${P}/by/${ownerId}`);
  return res.data;
}

// ---- one ----
export async function getProject(id: string): Promise<Project> {
  const res = await api.get(`${P}/${id}`);
  return res.data;
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  const res = await api.post(`${P}`, data);
  return res.data;
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const res = await api.put(`${P}/${id}`, data);
  return res.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`${P}/${id}`);
}

export async function toggleLike(id: string): Promise<{ likes: number; liked: boolean }> {
  const res = await api.post(`${P}/${id}/like`);
  return res.data;
}

// ---- comments ----
export async function listComments(projectId: string): Promise<Comment[]> {
  const res = await api.get(`${C}/${projectId}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function addComment(projectId: string, text: string, parent = ""): Promise<Comment> {
  const res = await api.post(`${C}/${projectId}`, { text, parent });
  return res.data;
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`${C}/item/${commentId}`);
}

export async function likeComment(commentId: string): Promise<{ likes: number; liked: boolean }> {
  const res = await api.post(`${C}/item/${commentId}/like`);
  return res.data;
}

export async function reactComment(commentId: string, emoji: string): Promise<{ emoji: string; user: string }[]> {
  const res = await api.post(`${C}/item/${commentId}/react`, { emoji });
  return res.data?.reactions || [];
}

// ---- saves / bookmarks ----
const S = "/projects/saves"; // rides the projects proxy

export async function listSaved(): Promise<Project[]> {
  const res = await api.get(S);
  return Array.isArray(res.data) ? res.data : [];
}

export async function savedIds(): Promise<string[]> {
  const res = await api.get(`${S}/ids`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function isSaved(projectId: string): Promise<boolean> {
  const res = await api.get(`${S}/check/${projectId}`);
  return !!res.data?.saved;
}

export async function toggleSave(projectId: string): Promise<{ saved: boolean }> {
  const res = await api.post(`${S}/${projectId}`);
  return res.data;
}

// feed
export async function feed(owners: string[]): Promise<Project[]> {
  const res = await api.post(`${P}/feed`, { owners });
  return Array.isArray(res.data) ? res.data : [];
}

// ---- collections ----
const COL = "/projects/collections";

export async function myCollections(): Promise<Collection[]> {
  const res = await api.get(`${COL}/mine`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function publicCollections(owner: string): Promise<Collection[]> {
  const res = await api.get(`${COL}/by/${owner}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getCollection(id: string): Promise<{ collection: Collection; projects: Project[] }> {
  const res = await api.get(`${COL}/${id}`);
  return res.data;
}

export async function createCollection(data: Partial<Collection>): Promise<Collection> {
  const res = await api.post(COL, data);
  return res.data;
}

export async function updateCollection(id: string, data: Partial<Collection>): Promise<Collection> {
  const res = await api.put(`${COL}/${id}`, data);
  return res.data;
}

export async function deleteCollection(id: string): Promise<void> {
  await api.delete(`${COL}/${id}`);
}

export async function addToCollection(id: string, projectId: string): Promise<void> {
  await api.post(`${COL}/${id}/items/${projectId}`);
}

export async function removeFromCollection(id: string, projectId: string): Promise<void> {
  await api.delete(`${COL}/${id}/items/${projectId}`);
}

// for you
export async function recommend(boostOwners: string[] = []): Promise<Project[]> {
  const res = await api.post(`${P}/recommend`, { boostOwners });
  return Array.isArray(res.data) ? res.data : [];
}

// reports
const R = "/moderation";

export interface Report {
  _id: string;
  reporter: string;
  reporterName: string;
  targetType: "project" | "comment";
  targetId: string;
  reason: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  createdAt?: string;
}

export async function fileReport(targetType: "project" | "comment", targetId: string, reason: string): Promise<{ message: string }> {
  const res = await api.post(`${R}`, { targetType, targetId, reason });
  return res.data;
}

export async function listReports(status = "OPEN"): Promise<Report[]> {
  const res = await api.get(`${R}`, { params: { status } });
  return res.data;
}

export async function setReportStatus(id: string, status: "OPEN" | "RESOLVED" | "DISMISSED"): Promise<Report> {
  const res = await api.put(`${R}/${id}`, { status });
  return res.data;
}

export async function removeReportTarget(id: string, targetType: "project" | "comment", targetId: string): Promise<{ message: string }> {
  const res = await api.post(`${R}/${id}/remove-target`, { targetType, targetId });
  return res.data;
}

// stories
const STO = "/projects/stories";

export interface StoryPoll {
  kind: "poll" | "question";
  question: string;
  options: string[];
}

export interface StoryVote {
  option: number;
  user: string;
  text?: string;
}

export interface Story {
  _id: string;
  owner: string;
  ownerUsername: string;
  ownerName: string;
  ownerAvatar?: string;
  imageUrl: string;
  imageKey?: string;
  caption?: string;
  poll?: StoryPoll | null;
  votes?: StoryVote[];
  createdAt?: string;
  expiresAt?: string;
}

export async function activeStories(owners: string[]): Promise<Story[]> {
  const res = await api.post(`${STO}/active`, { owners });
  return res.data;
}

export async function createStory(imageUrl: string, imageKey: string, caption = "", poll?: StoryPoll | null): Promise<Story> {
  const res = await api.post(`${STO}`, { imageUrl, imageKey, caption, poll: poll || null });
  return res.data;
}

export async function voteStory(storyId: string, option: number, text = ""): Promise<{ already: boolean; votes: StoryVote[] }> {
  const res = await api.post(`${STO}/${storyId}/vote`, { option, text });
  return res.data;
}

// past edits
export interface ProjectVersion {
  at?: string;
  title: string;
  summary: string;
  description: string;
  coverUrl: string;
  category: string;
}

export async function projectVersions(id: string): Promise<ProjectVersion[]> {
  const res = await api.get(`${P}/${id}/versions`).catch(() => ({ data: [] }));
  return res.data || [];
}

export async function restoreVersion(id: string, index: number): Promise<Project> {
  const res = await api.post(`${P}/${id}/restore/${index}`);
  return res.data;
}
