"use client";

// UserPreview.tsx
// mini profile

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { FiX, FiUserPlus, FiUserCheck } from "react-icons/fi";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { addFollow, removeFollow } from "../store/followReducer";
import { getCreator, followCounts, isFollowing, toggleFollow } from "../(portfolio)/Account/client";
import type { Creator } from "../lib/types";
import { onAvatarError } from "../lib/img";

export default function UserPreview({ username, onClose }: { username: string; onClose: () => void }) {
  const me = useAppSelector((s) => s.account.currentUser);
  const dispatch = useAppDispatch();
  const [c, setC] = useState<Creator | null>(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [following, setFollowing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    let alive = true;
    getCreator(username)
      .then(async (cr) => {
        if (!alive) return;
        setC(cr);
        const cnt = await followCounts(cr._id).catch(() => ({ followers: 0, following: 0 }));
        if (alive) setCounts(cnt);
        if (me && me._id !== cr._id) isFollowing(cr._id).then((f) => alive && setFollowing(f)).catch(() => {});
      })
      .catch(() => onClose());
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const doFollow = async () => {
    if (!c || !me) return;
    const res = await toggleFollow(c._id);
    setFollowing(res.following);
    setCounts((x) => ({ ...x, followers: x.followers + (res.following ? 1 : -1) }));
    dispatch(res.following ? addFollow(c._id) : removeFollow(c._id));
  };

  if (!mounted) return null;

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(20,12,14,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(360px, 92vw)", position: "relative" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", color: "var(--cocoa-2)" }}>
          <FiX size={20} />
        </button>
        {!c ? (
          <p className="muted" style={{ margin: 0 }}>loading…</p>
        ) : (
          <>
            <Link href={`/Creators/${c.username}`} onClick={onClose} className="row" style={{ gap: 14, textDecoration: "none", color: "inherit" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="avatar" src={c.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={c.displayName} width={64} height={64} style={{ borderRadius: "50%", border: "3px solid " + (c.openToWork ? "#3fae6a" : "var(--pink)"), flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{c.displayName}</div>
                <div className="muted" style={{ fontSize: "0.82rem" }}>@{c.username}</div>
                {c.headline && <div className="muted" style={{ fontSize: "0.82rem" }}>{c.headline}</div>}
              </div>
            </Link>
            {c.bio && (
              <p className="muted" style={{ fontSize: "0.88rem", margin: "10px 0 0", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {c.bio}
              </p>
            )}
            <div className="row" style={{ gap: 18, marginTop: 10, fontSize: "0.85rem" }}>
              <span>
                <b>{counts.followers}</b> followers
              </span>
              <span>
                <b>{counts.following}</b> following
              </span>
            </div>
            <div className="row" style={{ gap: 8, marginTop: 14 }}>
              {me && me._id !== c._id && (
                <button className={"btn btn-sm " + (following ? "btn-cream" : "btn-pink")} onClick={doFollow}>
                  {following ? (
                    <>
                      <FiUserCheck /> Following
                    </>
                  ) : (
                    <>
                      <FiUserPlus /> Follow
                    </>
                  )}
                </button>
              )}
              <Link href={`/Creators/${c.username}`} className="btn btn-cream btn-sm" onClick={onClose}>
                View profile
              </Link>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
