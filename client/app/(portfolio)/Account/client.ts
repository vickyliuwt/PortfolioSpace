// Account/client.ts
// talks to /api/auth/*

import api from "../../lib/api";
import type { Creator, FollowCounts, AppNotification, MessageThread, DirectMessage, ChatUser } from "../../lib/types";

const AUTH = "/auth";

export interface SignupData {
  username: string;
  password: string;
  email: string;
  displayName?: string;
  headline?: string;
  skills?: string[];
}

export async function signup(data: SignupData): Promise<Creator> {
  const res = await api.post(`${AUTH}/signup`, data);
  return res.data;
}

export async function signin(username: string, password: string): Promise<Creator> {
  const res = await api.post(`${AUTH}/signin`, { username, password });
  return res.data;
}

export async function signout(): Promise<void> {
  await api.post(`${AUTH}/signout`);
}

// returns null if not logged in (401)
export async function profile(): Promise<Creator | null> {
  try {
    const res = await api.get(`${AUTH}/profile`);
    return res.data;
  } catch {
    return null;
  }
}

export async function updateProfile(updates: Partial<Creator>): Promise<Creator> {
  const res = await api.put(`${AUTH}/profile`, updates);
  return res.data;
}

export async function setAvatar(key: string, url: string): Promise<Creator> {
  const res = await api.put(`${AUTH}/profile/avatar`, { key, url });
  return res.data;
}

export async function setPlan(plan: "FREE" | "PRO"): Promise<Creator> {
  const res = await api.put(`${AUTH}/profile/plan`, { plan });
  return res.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.put(`${AUTH}/profile/password`, { currentPassword, newPassword });
}

export async function listCreators(q = ""): Promise<Creator[]> {
  const res = await api.get(`${AUTH}/creators`, { params: { q } });
  return res.data;
}

export async function getCreator(username: string): Promise<Creator> {
  const res = await api.get(`${AUTH}/creators/${username}`);
  return res.data;
}

// ---- follows ----
const FOLLOW = "/auth/follow";

export async function toggleFollow(userId: string): Promise<{ following: boolean }> {
  const res = await api.post(`${FOLLOW}/${userId}`);
  return res.data;
}

export async function isFollowing(userId: string): Promise<boolean> {
  const res = await api.get(`${FOLLOW}/check/${userId}`);
  return !!res.data?.following;
}

export async function followCounts(userId: string): Promise<FollowCounts> {
  const res = await api.get(`${FOLLOW}/counts/${userId}`);
  return res.data;
}

export async function myFollowing(): Promise<Creator[]> {
  const res = await api.get(`${FOLLOW}/following`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function myFollowers(): Promise<Creator[]> {
  const res = await api.get(`${FOLLOW}/followers`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function followingIds(): Promise<string[]> {
  const res = await api.get(`${FOLLOW}/following-ids`);
  return Array.isArray(res.data) ? res.data : [];
}

// top creators
export async function topCreators(limit = 60): Promise<Creator[]> {
  const res = await api.get(`${FOLLOW}/top`, { params: { limit } });
  return Array.isArray(res.data) ? res.data : [];
}

// ---- notifications ----
const NOTIF = "/auth/notifications";

export async function listNotifications(): Promise<AppNotification[]> {
  const res = await api.get(NOTIF);
  return Array.isArray(res.data) ? res.data : [];
}

export async function unreadCount(): Promise<number> {
  try {
    const res = await api.get(`${NOTIF}/unread-count`);
    return res.data?.count || 0;
  } catch {
    return 0;
  }
}

export async function markAllRead(): Promise<void> {
  await api.post(`${NOTIF}/read-all`);
}

// ---- messages ----
const MSG = "/auth/messages";

export async function listThreads(): Promise<MessageThread[]> {
  const res = await api.get(`${MSG}/threads`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function messagesUnread(): Promise<number> {
  try {
    const res = await api.get(`${MSG}/unread-total`);
    return res.data?.count || 0;
  } catch {
    return 0;
  }
}

export async function getConversation(userId: string): Promise<DirectMessage[]> {
  const res = await api.get(`${MSG}/with/${userId}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function messageUserCard(userId: string): Promise<ChatUser | null> {
  try {
    const res = await api.get(`${MSG}/user/${userId}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function sendMessage(
  userId: string,
  text: string,
  extra: {
    imageUrl?: string;
    imageKey?: string;
    audioUrl?: string;
    audioKey?: string;
    audioSecs?: number;
    sticker?: string;
    project?: { id: string; title: string; cover: string; owner: string } | null;
  } = {}
): Promise<DirectMessage> {
  const res = await api.post(`${MSG}/${userId}`, { text, ...extra });
  return res.data;
}

export async function pingTyping(userId: string): Promise<void> {
  await api.post(`${MSG}/${userId}/typing`).catch(() => {});
}

export async function getTyping(userId: string): Promise<boolean> {
  const res = await api.get(`${MSG}/${userId}/typing`).catch(() => ({ data: { typing: false } }));
  return !!res.data?.typing;
}

// unsend
export async function deleteMessage(msgId: string): Promise<void> {
  await api.delete(`${MSG}/item/${msgId}`);
}

// ---- skill endorsements ----
const ENDORSE = "/auth/endorsements";
export async function toggleEndorse(owner: string, skill: string): Promise<{ endorsed: boolean; count: number }> {
  const res = await api.post(`${ENDORSE}`, { owner, skill });
  return res.data;
}
export async function getEndorsements(userId: string): Promise<Record<string, { count: number; mine: boolean }>> {
  const res = await api.get(`${ENDORSE}/${userId}`).catch(() => ({ data: {} }));
  return res.data || {};
}

// ---- recommendations ----
const RECO = "/auth/recommendations";
export interface Recommendation {
  _id: string;
  forUser: string;
  author: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  text: string;
  createdAt?: string;
}
export async function addRecommendation(forUser: string, text: string): Promise<Recommendation> {
  const res = await api.post(`${RECO}`, { forUser, text });
  return res.data;
}
export async function listRecommendations(userId: string): Promise<Recommendation[]> {
  const res = await api.get(`${RECO}/${userId}`);
  return res.data;
}
export async function deleteRecommendation(id: string): Promise<void> {
  await api.delete(`${RECO}/${id}`);
}

// who opened my profile
const VIEWS = "/auth/profile-views";
export interface ProfileViewer {
  _id: string;
  viewer: string;
  viewerName: string;
  viewerUsername: string;
  viewerAvatar?: string;
  viewerHeadline?: string;
  lastAt?: string;
  count?: number;
}
export async function myProfileViews(): Promise<{ total: number; viewers: ProfileViewer[] }> {
  const res = await api.get(`${VIEWS}/mine`).catch(() => ({ data: { total: 0, viewers: [] } }));
  return res.data || { total: 0, viewers: [] };
}

// blocking
const BLOCK = "/auth/blocks";
export async function toggleBlock(userId: string): Promise<{ blocked: boolean }> {
  const res = await api.post(`${BLOCK}/${userId}`);
  return res.data;
}
export async function isBlocked(userId: string): Promise<boolean> {
  const res = await api.get(`${BLOCK}/check/${userId}`).catch(() => ({ data: { blocked: false } }));
  return !!res.data?.blocked;
}
export async function myBlocks(): Promise<{ _id: string; username: string; displayName: string; avatarUrl?: string }[]> {
  const res = await api.get(`${BLOCK}/mine`).catch(() => ({ data: [] }));
  return res.data || [];
}
