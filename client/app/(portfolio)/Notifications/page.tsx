"use client";

// Notifications/page.tsx
// likes / comments / saves / follows on my stuff

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiHeart, FiMessageCircle, FiBookmark, FiUserPlus, FiAtSign, FiSend, FiUsers } from "react-icons/fi";
import ProtectedRoute from "../../components/ProtectedRoute";
import PawLoader from "../../components/PawLoader";
import EmptyState from "../../components/EmptyState";
import { listNotifications, markAllRead } from "../Account/client";
import type { AppNotification } from "../../lib/types";
import UserPreview from "../../components/UserPreview";
import { onAvatarError } from "../../lib/img";

const ICON: Record<AppNotification["type"], React.ReactElement> = {
  like: <FiHeart />,
  comment: <FiMessageCircle />,
  save: <FiBookmark />,
  follow: <FiUserPlus />,
  reply: <FiMessageCircle />,
  mention: <FiAtSign />,
  message: <FiSend />,
  collab: <FiUsers />,
};

const VERB: Record<AppNotification["type"], string> = {
  like: "liked",
  comment: "commented on",
  save: "saved",
  follow: "started following you",
  reply: "replied on",
  mention: "mentioned you in",
  message: "messaged you",
  collab: "credited you on",
};

function timeAgo(iso?: string) {
  if (!iso) return "";
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// bundle same type + same project into one line
interface Group {
  key: string;
  type: string;
  project?: string;
  projectTitle?: string;
  actors: AppNotification[];
  latest: AppNotification;
  unread: boolean;
}

function groupNotes(list: AppNotification[]): Group[] {
  const map = new Map<string, Group>();
  for (const n of list) {
    const key = `${n.type}:${n.project || "none"}`;
    const g = map.get(key);
    if (g) {
      if (!g.actors.some((a) => a.actorUsername === n.actorUsername)) g.actors.push(n);
      if (!n.read) g.unread = true;
    } else {
      map.set(key, {
        key,
        type: n.type,
        project: n.project,
        projectTitle: n.projectTitle,
        actors: [n],
        latest: n,
        unread: !n.read,
      });
    }
  }
  return [...map.values()];
}

// "amy", "amy and ben", "amy and 4 others"
function actorLine(g: Group): string {
  const names = g.actors.map((a) => a.actorName || a.actorUsername);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]} and ${names.length - 1} others`;
}

function Inner() {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    listNotifications()
      .then((list) => {
        setItems(list);
        markAllRead().catch(() => {});
      })
      .catch(() => setItems([]));
  }, []);

  return (
    <>
    <div className="wrap section page-enter" style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 18 }}>
        <span className="eyebrow">🔔 activity</span>
        <h1 className="section-title">Notifications</h1>
      </div>

      {items === null ? (
        <PawLoader />
      ) : items.length === 0 ? (
        <EmptyState emoji="🔔" title="No activity yet" hint="Likes, comments, saves and follows will land here." />
      ) : (
        <div className="stack">
          {groupNotes(items).map((g) => (
            <div
              key={g.key}
              className="card card-tight"
              style={{ borderLeft: g.unread ? "3px solid var(--pink)" : "3px solid transparent" }}
            >
              <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                <button
                  onClick={() => setPreview(g.latest.actorUsername)}
                  aria-label={`Preview ${g.latest.actorName}`}
                  style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="avatar" src={g.latest.actorAvatar || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={g.latest.actorName} width={40} height={40} style={{ borderRadius: "50%", border: "2px solid var(--pink)", display: "block" }} />
                  <span style={{ position: "absolute", bottom: -3, right: -3, width: 20, height: 20, borderRadius: "50%", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", color: "var(--rose)", border: "1.5px solid var(--line)" }}>
                    {ICON[g.type]}
                  </span>
                </button>
                <div style={{ flex: 1 }}>
                  <div>
                    {g.actors.length === 1 ? (
                      <Link href={`/Creators/${g.latest.actorUsername}`} style={{ fontWeight: 700, color: "var(--cocoa)" }}>
                        {actorLine(g)}
                      </Link>
                    ) : (
                      <b style={{ color: "var(--cocoa)" }}>{actorLine(g)}</b>
                    )}{" "}
                    <span className="muted">{VERB[g.type]}</span>{" "}
                    {g.project && g.projectTitle && (
                      <Link href={`/Projects/${g.project}`} style={{ fontWeight: 700, color: "var(--rose)" }}>
                        {g.projectTitle}
                      </Link>
                    )}
                  </div>
                  {g.actors.length === 1 && g.latest.text && (
                    <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.88rem" }}>
                      “{g.latest.text}”
                    </p>
                  )}
                  {g.actors.length > 1 && (
                    <div className="row" style={{ gap: 6, marginTop: 6 }}>
                      {g.actors.slice(0, 5).map((a) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={a._id} className="avatar avatar-sm" src={a.actorAvatar || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={a.actorName} style={{ width: 24, height: 24 }} />
                      ))}
                    </div>
                  )}
                  <div className="muted" style={{ fontSize: "0.75rem", marginTop: 3 }}>
                    {timeAgo(g.latest.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    {preview && <UserPreview username={preview} onClose={() => setPreview(null)} />}
    </>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  );
}
