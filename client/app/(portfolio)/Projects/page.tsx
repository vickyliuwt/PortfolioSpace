"use client";

// Projects/page.tsx
// my work dashboard

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiPlus, FiEdit2, FiTrash2, FiHeart, FiEye, FiFolder, FiUsers } from "react-icons/fi";
import ProtectedRoute from "../../components/ProtectedRoute";
import PawLoader from "../../components/PawLoader";
import EmptyState from "../../components/EmptyState";
import { useAppSelector } from "../../store/hooks";
import { myProjects, myStats, deleteProject } from "./client";
import type { Project } from "../../lib/types";
import { onCoverError } from "../../lib/img";

function Inner() {
  const me = useAppSelector((s) => s.account.currentUser);
  const [items, setItems] = useState<Project[] | null>(null);
  const [stats, setStats] = useState({ total: 0, public: 0, likes: 0, views: 0 });

  const load = async () => {
    const [list, s] = await Promise.all([myProjects(), myStats()]);
    setItems(list);
    setStats(s);
  };

  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  // confirm then delete
  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await deleteProject(id);
    load();
  };

  const shared = (items || []).filter((p) => p.owner !== me?._id).length;

  const cells = [
    { label: "Projects", value: stats.total, icon: <FiFolder /> },
    { label: "Public", value: stats.public, icon: <FiEye /> },
    { label: "Likes", value: stats.likes, icon: <FiHeart /> },
    { label: "Views", value: stats.views, icon: <FiEye /> },
  ];
  // only worth a cell when someone actually credited her
  if (shared > 0) cells.push({ label: "Shared with you", value: shared, icon: <FiUsers /> });

  return (
    <div className="wrap section page-enter">
      <div className="spread" style={{ marginBottom: 18, alignItems: "flex-end" }}>
        <div>
          <span className="eyebrow">📁 your studio</span>
          <h1 className="section-title">My work</h1>
          <p className="section-sub">Everything you&apos;ve made, plus anything you&apos;re credited on.</p>
        </div>
        <Link href="/Projects/New" className="btn btn-pink">
          <FiPlus /> New project
        </Link>
      </div>

      {/* stats */}
      <div className="stats-band" style={{ marginBottom: 24 }}>
        {cells.map((c) => (
          <div key={c.label} className="stat-cell">
            <div className="stat-num">{c.value}</div>
            <div className="stat-label">
              {c.icon} {c.label}
            </div>
          </div>
        ))}
      </div>

      {items === null ? (
        <PawLoader />
      ) : items.length === 0 ? (
        <EmptyState
          emoji="📁"
          title="No projects yet"
          hint="Add your first piece — a reel, an illustration, anything."
          ctaHref="/Projects/New"
          ctaLabel="Add a project"
        />
      ) : (
        <div className="grid">
          {items.map((p) => {
            const mine = p.owner === me?._id;
            return (
            <div key={p._id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <Link href={`/Projects/${p._id}`} style={{ position: "relative", display: "block", lineHeight: 0 }}>
                {p.featured && <span className="featured-badge">★ Featured</span>}
                {p.status === "DRAFT" && (
                  <span className="pill" style={{ position: "absolute", top: 10, left: 10, background: "var(--cocoa)", color: "#fff", zIndex: 2 }}>
                    ✎ Draft
                  </span>
                )}
                {!mine && (
                  <span className="pill c-sky" style={{ position: "absolute", bottom: 10, left: 10, zIndex: 2 }}>
                    <FiUsers style={{ verticalAlign: "-2px" }} /> shared with you
                  </span>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.coverUrl || "/covers/cover-default.svg"} onError={onCoverError} alt={p.title} loading="lazy" style={{ width: "100%", height: "auto", display: "block", opacity: p.status === "DRAFT" ? 0.75 : 1 }} />
              </Link>
              <div style={{ padding: 15, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <div className="spread">
                  <span className="pill c-pink">{p.category}</span>
                  {p.visibility === "PRIVATE" && <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>🔒 private</span>}
                  {p.visibility === "FRIENDS" && <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>👥 followers</span>}
                </div>
                <h3 style={{ fontSize: "1.05rem", margin: "6px 0 2px" }}>{p.title}</h3>
                {!mine && (
                  <div className="muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                    posted by @{p.ownerUsername}
                  </div>
                )}
                <div className="spread" style={{ marginTop: "auto", paddingTop: 8 }}>
                  <span className="row" style={{ gap: 12, fontSize: "0.82rem", color: "var(--cocoa-2)" }}>
                    <span className="row" style={{ gap: 4 }}>
                      <FiHeart /> {p.likes}
                    </span>
                    <span className="row" style={{ gap: 4 }}>
                      <FiEye /> {p.views}
                    </span>
                  </span>
                  <span className="row" style={{ gap: 6 }}>
                    <Link href={`/Projects/${p._id}/Edit`} className="btn btn-cream btn-sm" aria-label="Edit">
                      <FiEdit2 />
                    </Link>
                    {mine && (
                      <button className="btn btn-danger btn-sm" onClick={() => remove(p._id, p.title)} aria-label="Delete">
                        <FiTrash2 />
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MyProjectsPage() {
  return (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  );
}
