"use client";

// Creators/page.tsx
// creators page

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FiSearch, FiUserPlus, FiUserCheck, FiUsers } from "react-icons/fi";
import PawLoader from "../../components/PawLoader";
import EmptyState from "../../components/EmptyState";
import { useAppSelector } from "../../store/hooks";
import { listCreators, topCreators, followingIds, toggleFollow } from "../Account/client";
import type { Creator } from "../../lib/types";
import { onAvatarError } from "../../lib/img";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function CreatorsPage() {
  const me = useAppSelector((s) => s.account.currentUser);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"popular" | "new">("popular");
  const [creators, setCreators] = useState<Creator[] | null>(null);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  const ranked = sort === "popular" && !q.trim();

  const load = useCallback(async () => {
    setCreators(null);
    try {
      const [list, ids] = await Promise.all([
        ranked ? topCreators(80) : listCreators(q.trim()),
        me ? followingIds() : Promise.resolve([] as string[]),
      ]);
      setCreators(list);
      setFollowingSet(new Set(ids));
    } catch {
      setCreators([]);
    }
  }, [q, ranked, me]);

  // small debounce for search
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const toggle = async (id: string) => {
    const res = await toggleFollow(id);
    setFollowingSet((old) => {
      const next = new Set(old);
      if (res.following) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="wrap section page-enter">
      <div style={{ marginBottom: 18 }}>
        <span className="eyebrow">🌸 community</span>
        <h1 className="section-title">Creators</h1>
        <p className="section-sub">Find makers to follow — artists, designers and engineers.</p>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <FiSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--pink-ink)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creators…" style={{ paddingLeft: 40 }} aria-label="Search creators" />
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className={"chip " + (sort === "popular" ? "active" : "")} onClick={() => setSort("popular")}>Popular</button>
          <button className={"chip " + (sort === "new" ? "active" : "")} onClick={() => setSort("new")}>Newest</button>
        </div>
      </div>

      {creators === null ? (
        <PawLoader />
      ) : creators.length === 0 ? (
        <EmptyState emoji="🌸" title="No creators found" hint="Try a different name." />
      ) : (
        <div className="grid">
          {creators.map((c, i) => (
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
                  <div style={{ fontWeight: 800 }}>
                    {ranked && i < 3 && <span style={{ marginRight: 4 }}>{MEDALS[i]}</span>}
                    {c.displayName} {c.plan === "PRO" && <span className="pill pill-pro" style={{ fontSize: "0.6rem" }}>pro</span>}
                  </div>
                  <div className="muted" style={{ fontSize: "0.82rem" }}>@{c.username}</div>
                </div>
              </Link>
              {c.headline && (
                <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                  {c.headline}
                </p>
              )}
              <div className="spread" style={{ marginTop: "auto", alignItems: "center" }}>
                {typeof c.followers === "number" ? (
                  <span className="row muted" style={{ gap: 5, fontSize: "0.82rem", fontWeight: 700 }}>
                    <FiUsers /> {c.followers} {c.followers === 1 ? "follower" : "followers"}
                  </span>
                ) : (
                  <span />
                )}
                {me && me._id !== c._id && (
                  <button
                    className={"btn btn-sm " + (followingSet.has(c._id) ? "btn-cream" : "btn-pink")}
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
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
