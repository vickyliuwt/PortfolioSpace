"use client";

// Discover/page.tsx
// discover

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import ProjectCard from "../../components/ProjectCard";
import PawLoader from "../../components/PawLoader";
import EmptyState from "../../components/EmptyState";
import { discover, toggleLike } from "../Projects/client";
import { listCreators } from "../Account/client";
import { useAppSelector } from "../../store/hooks";
import { CATEGORIES, KINDS, categoriesForKind } from "../../lib/types";
import type { Project, Creator } from "../../lib/types";
import { onAvatarError } from "../../lib/img";

const SORTS = [
  { key: "new", label: "Newest" },
  { key: "popular", label: "Most loved" },
  { key: "views", label: "Most viewed" },
] as const;

export default function DiscoverPage() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("All");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<"new" | "popular" | "views">("new");
  const [items, setItems] = useState<Project[] | null>(null);
  const [people, setPeople] = useState<Creator[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [hint, setHint] = useState(false);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const router = useRouter();
  const me = useAppSelector((st) => st.account.currentUser);

  const PAGE = 24;

  const load = useCallback(async () => {
    setItems(null);
    setPage(0);
    setMore(true);
    try {
      const [data, ppl] = await Promise.all([
        discover({ q, kind, category, sort, page: 0, limit: PAGE }),
        q.trim() ? listCreators(q.trim()) : Promise.resolve([] as Creator[]),
      ]);
      setItems(data);
      setMore(data.length >= PAGE);
      setPeople(ppl);
    } catch {
      setItems([]);
      setPeople([]);
    }
  }, [q, kind, category, sort]);

  // debounce
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // next page
  const loadMore = useCallback(async () => {
    if (loadingMore || !more) return;
    setLoadingMore(true);
    const next = page + 1;
    try {
      const data = await discover({ q, kind, category, sort, page: next, limit: PAGE });
      setItems((old) => [...(old || []), ...data]);
      setPage(next);
      setMore(data.length >= PAGE);
    } catch {
      setMore(false);
    } finally {
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, more, loadingMore, q, kind, category, sort]);

  // watch the bottom
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  // shortcuts
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      const list = items || [];
      if (!list.length) return;

      if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        setCursor((c) => {
          const next = e.key === "j" ? Math.min(list.length - 1, c + 1) : Math.max(0, c <= 0 ? 0 : c - 1);
          cellRefs.current[next]?.scrollIntoView({ block: "center", behavior: "smooth" });
          return next;
        });
      } else if (e.key === "l") {
        if (cursor < 0 || !me) return;
        e.preventDefault();
        const target = list[cursor];
        if (target) await toggleLike(target._id).catch(() => {});
      } else if (e.key === "Enter") {
        if (cursor < 0) return;
        const target = list[cursor];
        if (target) router.push(`/Projects/${target._id}`);
      } else if (e.key === "?") {
        setHint((h) => !h);
      } else if (e.key === "Escape") {
        setHint(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, cursor, me, router]);

  return (
    <div className="wrap section page-enter">
      {hint && (
        <div onClick={() => setHint(false)} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(20,12,14,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(340px, 92vw)" }}>
            <h3 style={{ margin: "0 0 10px" }}>Keyboard shortcuts</h3>
            <div className="stack" style={{ gap: 8, fontSize: "0.9rem" }}>
              <div className="spread"><span className="muted">next / previous</span><b>j / k</b></div>
              <div className="spread"><span className="muted">like selected</span><b>l</b></div>
              <div className="spread"><span className="muted">open selected</span><b>enter</b></div>
              <div className="spread"><span className="muted">this help</span><b>?</b></div>
            </div>
          </div>
        </div>
      )}
      <div className="spread" style={{ marginBottom: 20, alignItems: "flex-end" }}>
        <div>
          <span className="eyebrow">🔍 explore</span>
          <h1 className="section-title">Discover</h1>
          <p className="section-sub">Search work and the people behind it — art and engineering alike.</p>
        </div>
        <Link href="/Creators" className="btn btn-cream btn-sm">Browse creators</Link>
      </div>

      {/* search + filters */}
      <div className="card" style={{ padding: 18, marginBottom: 22 }}>
        <div style={{ position: "relative" }}>
          <FiSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--pink-ink)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles, tags, tools…"
            style={{ paddingLeft: 40 }}
            aria-label="Search"
          />
        </div>

        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <button className={"chip" + (kind === "All" ? " active" : "")} onClick={() => { setKind("All"); setCategory("All"); }}>
            All types
          </button>
          {KINDS.map((k) => (
            <button key={k.key} className={"chip" + (kind === k.key ? " active" : "")} onClick={() => { setKind(k.key); setCategory("All"); }}>
              <span style={{ fontSize: "1.02rem" }}>{k.emoji}</span> {k.label}
            </button>
          ))}
        </div>

        <div className="spread" style={{ marginTop: 12, alignItems: "flex-start" }}>
          <div className="row" style={{ gap: 8 }}>
            <button className={"chip" + (category === "All" ? " active" : "")} onClick={() => setCategory("All")}>
              All
            </button>
            {(kind === "All" ? CATEGORIES : categoriesForKind(kind)).map((c) => (
              <button key={c} className={"chip" + (category === c ? " active" : "")} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} style={{ width: "auto", minWidth: 150 }} aria-label="Sort">
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* results */}
      {items === null ? (
        <PawLoader label="fetching pretty things…" />
      ) : (
        <>
          {people.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div className="spread" style={{ marginBottom: 12 }}>
                <p className="muted" style={{ fontWeight: 700, margin: 0 }}>People</p>
                <Link href="/Creators" style={{ fontWeight: 700, color: "var(--rose)", fontSize: "0.85rem" }}>See all →</Link>
              </div>
              <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
                {people.map((c) => (
                  <Link
                    key={c._id}
                    href={`/Creators/${c.username}`}
                    className="card card-tight"
                    style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none", color: "inherit", minWidth: 210 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="avatar" src={c.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={c.displayName} width={44} height={44} style={{ borderRadius: "50%" }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {c.displayName} {c.plan === "PRO" && <span className="pill pill-pro" style={{ fontSize: "0.6rem" }}>pro</span>}
                      </div>
                      <div className="muted" style={{ fontSize: "0.82rem" }}>@{c.username}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {items.length === 0 && people.length === 0 ? (
            <EmptyState emoji="🐾" title="Nothing matched" hint="Try a different word or category." />
          ) : items.length > 0 ? (
            <>
              <p className="muted" style={{ marginBottom: 14, fontWeight: 700 }}>
                {items.length} {items.length === 1 ? "project" : "projects"}
              </p>
              <p className="muted" style={{ fontSize: "0.78rem", margin: "0 0 10px" }}>Tip: press <b>?</b> for keyboard shortcuts</p>
              <div className="grid">
                {items.map((p, i) => (
                  <div
                    key={p._id}
                    ref={(el) => {
                      cellRefs.current[i] = el;
                    }}
                    style={{ outline: cursor === i ? "3px solid var(--rose)" : "none", outlineOffset: 3, borderRadius: "var(--radius)" }}
                  >
                    <ProjectCard project={p} />
                  </div>
                ))}
              </div>

              <div ref={sentinel} style={{ height: 1 }} />
              {loadingMore && <p className="muted center" style={{ marginTop: 14 }}>loading more…</p>}
              {!more && items.length > 0 && <p className="muted center" style={{ marginTop: 14, fontSize: "0.85rem" }}>that is everything</p>}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
