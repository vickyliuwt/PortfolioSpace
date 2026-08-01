"use client";

// Welcome/page.tsx
// onboarding

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiUserPlus, FiUserCheck, FiArrowRight } from "react-icons/fi";
import ProtectedRoute from "../../components/ProtectedRoute";
import PawLoader from "../../components/PawLoader";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { setFollowing } from "../../store/followReducer";
import { topCreators, followingIds, toggleFollow } from "../Account/client";
import type { Creator } from "../../lib/types";
import { onAvatarError } from "../../lib/img";

function WelcomeInner() {
  const me = useAppSelector((s) => s.account.currentUser)!;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[] | null>(null);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([topCreators(30), followingIds()])
      .then(([list, ids]) => {
        setCreators(list.filter((c) => c._id !== me._id));
        setFollowingSet(new Set(ids));
      })
      .catch(() => setCreators([]));
  }, [me._id]);

  const toggle = async (id: string) => {
    const res = await toggleFollow(id);
    setFollowingSet((old) => {
      const next = new Set(old);
      if (res.following) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // sync then go
  const done = () => {
    dispatch(setFollowing([...followingSet]));
    router.push("/");
  };

  return (
    <div className="wrap section page-enter" style={{ maxWidth: 860 }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ fontSize: 46 }}>🐾</div>
        <span className="eyebrow">welcome, {me.displayName || me.username}!</span>
        <h1 className="section-title">Follow a few creators</h1>
        <p className="section-sub">Pick some makers and your feed fills up with their newest work.</p>
      </div>

      {creators === null ? (
        <PawLoader />
      ) : creators.length === 0 ? (
        <p className="muted center">No creators to suggest yet — check back soon.</p>
      ) : (
        <div className="grid">
          {creators.map((c) => (
            <div key={c._id} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href={`/Creators/${c.username}`} className="row" style={{ gap: 12, textDecoration: "none", color: "inherit" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="avatar"
                  src={c.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError}
                  alt={c.displayName}
                  width={52}
                  height={52}
                  style={{ borderRadius: "50%", border: "2px solid var(--pink)" }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{c.displayName}</div>
                  <div className="muted" style={{ fontSize: "0.82rem" }}>@{c.username}</div>
                </div>
              </Link>
              {c.headline && (
                <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                  {c.headline}
                </p>
              )}
              <button
                className={"btn btn-sm " + (followingSet.has(c._id) ? "btn-cream" : "btn-pink")}
                style={{ marginTop: "auto", alignSelf: "flex-start" }}
                onClick={() => toggle(c._id)}
              >
                {followingSet.has(c._id) ? (
                  <>
                    <FiUserCheck /> Following
                  </>
                ) : (
                  <>
                    <FiUserPlus /> Follow
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="center" style={{ marginTop: 26 }}>
        <button className="btn btn-primary" onClick={done}>
          {followingSet.size > 0 ? "Continue" : "Skip for now"} <FiArrowRight />
        </button>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <ProtectedRoute>
      <WelcomeInner />
    </ProtectedRoute>
  );
}
