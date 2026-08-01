"use client";

// Analytics/page.tsx
// my stats

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { FiEye, FiHeart, FiFolder, FiUsers, FiBarChart2 } from "react-icons/fi";
import ProtectedRoute from "../../components/ProtectedRoute";
import PawLoader from "../../components/PawLoader";
import EmptyState from "../../components/EmptyState";
import { useAppSelector } from "../../store/hooks";
import { myProjects, myStats, myTrend } from "../Projects/client";
import { followCounts } from "../Account/client";
import type { Project } from "../../lib/types";

interface Stats {
  total: number;
  public: number;
  drafts?: number;
  likes: number;
  views: number;
}

type TrendPoint = { day: string; views: number; likes: number };

// line chart
function TrendChart({ data }: { data: TrendPoint[] }) {
  const W = 720,
    H = 220,
    padL = 34,
    padR = 12,
    padT = 14,
    padB = 26;
  const n = data.length;
  const maxY = Math.max(1, ...data.map((d) => Math.max(d.views, d.likes)));
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(1, n - 1);
  const y = (v: number) => H - padB - (v / maxY) * (H - padT - padB);
  const path = (key: "views" | "likes") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(" ");
  const area =
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.views).toFixed(1)}`).join(" ") +
    ` L ${x(n - 1).toFixed(1)} ${(H - padB).toFixed(1)} L ${x(0).toFixed(1)} ${(H - padB).toFixed(1)} Z`;
  const totalViews = data.reduce((s2, d) => s2 + d.views, 0);
  const totalLikes = data.reduce((s2, d) => s2 + d.likes, 0);
  const ticks = [0, Math.round(maxY / 2), maxY];
  const short = (day: string) => day.slice(5);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="spread" style={{ marginBottom: 10, alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Views &amp; likes — last {n} days</h3>
        <div className="row" style={{ gap: 14, fontSize: "0.85rem", fontWeight: 700 }}>
          <span className="row" style={{ gap: 5 }}>
            <span style={{ width: 14, height: 4, borderRadius: 2, background: "var(--rose)", display: "inline-block" }} /> {totalViews} views
          </span>
          <span className="row" style={{ gap: 5 }}>
            <span style={{ width: 14, height: 4, borderRadius: 2, background: "var(--sky-ink)", display: "inline-block" }} /> {totalLikes} likes
          </span>
        </div>
      </div>
      {totalViews + totalLikes === 0 ? (
        <p className="muted" style={{ margin: 0 }}>No activity in this window yet — views and likes will chart here as they come in.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }} preserveAspectRatio="none" role="img" aria-label="views and likes trend">
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
              <text x={4} y={y(t) + 3} fontSize={10} fill="var(--cocoa-2)">
                {t}
              </text>
            </g>
          ))}
          <path d={area} fill="var(--pink-wash)" stroke="none" />
          <path d={path("views")} fill="none" stroke="var(--rose)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          <path d={path("likes")} fill="none" stroke="var(--sky-ink)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          <text x={padL} y={H - 6} fontSize={10} fill="var(--cocoa-2)">
            {short(data[0]?.day || "")}
          </text>
          <text x={W / 2} y={H - 6} fontSize={10} fill="var(--cocoa-2)" textAnchor="middle">
            {short(data[Math.floor(n / 2)]?.day || "")}
          </text>
          <text x={W - padR} y={H - 6} fontSize={10} fill="var(--cocoa-2)" textAnchor="end">
            {short(data[n - 1]?.day || "")}
          </text>
        </svg>
      )}
    </div>
  );
}

// one horizontal bar row
function Bar({ label, value, max, suffix }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4;
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="spread" style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--cocoa)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
          {label}
        </span>
        <span className="muted" style={{ fontSize: "0.82rem", fontWeight: 700 }}>
          {value}
          {suffix || ""}
        </span>
      </div>
      <div style={{ height: 12, borderRadius: 999, background: "var(--pink-wash)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--pink), var(--rose))", transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: 18 }}>
      <div style={{ color: "var(--rose)", fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--cocoa)", lineHeight: 1 }}>{value}</div>
      <div className="muted" style={{ fontSize: "0.82rem", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function AnalyticsInner() {
  const me = useAppSelector((s) => s.account.currentUser)!;
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [followers, setFollowers] = useState(0);
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);

  useEffect(() => {
    Promise.all([myProjects(), myStats(), followCounts(me._id), myTrend(30)])
      .then(([p, s, f, t]) => {
        // /mine also returns work she is only credited on, analytics is about her own
        const own = Array.isArray(p) ? p.filter((x) => x.owner === me._id) : [];
        setProjects(own);
        setStats(s);
        setFollowers(f?.followers || 0);
        setTrend(Array.isArray(t) ? t : []);
      })
      .catch(() => {
        setProjects([]);
        setStats({ total: 0, public: 0, likes: 0, views: 0 });
        setTrend([]);
      });
  }, [me._id]);

  if (projects === null || stats === null) return <PawLoader />;

  // top lists
  const byViews = [...projects].sort((a, b) => b.views - a.views).slice(0, 8);
  const byLikes = [...projects].sort((a, b) => b.likes - a.likes).slice(0, 8);
  const maxViews = byViews.length ? byViews[0].views : 0;
  const maxLikes = byLikes.length ? byLikes[0].likes : 0;

  // category counts
  const catMap = new Map<string, number>();
  projects.forEach((p) => catMap.set(p.category, (catMap.get(p.category) || 0) + 1));
  const cats = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = cats.length ? cats[0][1] : 0;

  // engagement: likes per view
  const engagement = stats.views > 0 ? Math.round((stats.likes / stats.views) * 100) : 0;

  return (
    <div className="wrap section page-enter">
      <div style={{ marginBottom: 18 }}>
        <span className="eyebrow">
          <FiBarChart2 /> insights
        </span>
        <h1 className="section-title">Analytics</h1>
        <p className="section-sub">A snapshot of how your work is doing.</p>
      </div>

      {stats.total === 0 ? (
        <EmptyState emoji="📊" title="Nothing to measure yet" hint="Post your first project and stats will show up here." ctaHref="/Projects/New" ctaLabel="Add a project" />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
            <StatTile icon={<FiFolder />} label="Projects" value={stats.total} />
            <StatTile icon={<FiEye />} label="Total views" value={stats.views} />
            <StatTile icon={<FiHeart />} label="Total likes" value={stats.likes} />
            <StatTile icon={<FiUsers />} label="Followers" value={followers} />
          </div>

          <div className="card" style={{ marginTop: 20, display: "flex", gap: 18, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div className="muted" style={{ fontSize: "0.82rem" }}>Public projects</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--cocoa)" }}>
                {stats.public} <span className="muted" style={{ fontSize: "0.9rem", fontWeight: 600 }}>/ {stats.total}</span>
              </div>
              {stats.drafts ? <div className="muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>{stats.drafts} in drafts</div> : null}
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div className="muted" style={{ fontSize: "0.82rem" }}>Avg views / project</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--cocoa)" }}>
                {stats.total ? Math.round(stats.views / stats.total) : 0}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div className="muted" style={{ fontSize: "0.82rem" }}>Engagement (likes / views)</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--cocoa)" }}>{engagement}%</div>
            </div>
          </div>

          {trend && <TrendChart data={trend} />}

          <div className="chat-grid" style={{ marginTop: 20 }}>
            <div className="card">
              <h3 style={{ margin: "0 0 14px" }}>
                <FiEye style={{ verticalAlign: "-2px" }} /> Most viewed
              </h3>
              {byViews.map((p) => (
                <Bar key={p._id} label={p.title} value={p.views} max={maxViews} />
              ))}
            </div>

            <div className="card">
              <h3 style={{ margin: "0 0 14px" }}>
                <FiHeart style={{ verticalAlign: "-2px" }} /> Most liked
              </h3>
              {byLikes.map((p) => (
                <Bar key={p._id} label={p.title} value={p.likes} max={maxLikes} />
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={{ margin: "0 0 14px" }}>Work by category</h3>
            {cats.map(([cat, n]) => (
              <Bar key={cat} label={cat} value={n} max={maxCat} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsInner />
    </ProtectedRoute>
  );
}
