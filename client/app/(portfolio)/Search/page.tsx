"use client";

// Search/page.tsx
// global search

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiSearch, FiMessageCircle } from "react-icons/fi";
import ProjectCard from "../../components/ProjectCard";
import PawLoader from "../../components/PawLoader";
import { allTags } from "../Projects/client";
import { searchProjects, searchMessages } from "../../lib/search";
import type { MsgHit } from "../../lib/search";
import { listCreators } from "../Account/client";
import type { Project, Creator } from "../../lib/types";
import { useAppSelector } from "../../store/hooks";
import { onAvatarError } from "../../lib/img";

type Tab = "all" | "projects" | "people" | "tags" | "chats";
const TABS: Tab[] = ["all", "projects", "people", "tags", "chats"];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<Creator[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [engine, setEngine] = useState<"elasticsearch" | "mongo">("mongo");
  const [msgs, setMsgs] = useState<MsgHit[]>([]);
  const me = useAppSelector((st) => st.account.currentUser);

  // debounced
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const query = q.trim();
      const [pros, ppl, allT, chats] = await Promise.all([
        searchProjects(query),
        listCreators(query).catch(() => [] as Creator[]),
        allTags().catch(() => [] as string[]),
        me && query ? searchMessages(query) : Promise.resolve({ engine: "off" as const, items: [] as MsgHit[] }),
      ]);
      if (!alive) return;
      setProjects(pros.items);
      setEngine(pros.engine);
      setMsgs(chats.items);
      setPeople(ppl);
      setTags(query ? allT.filter((tg) => tg.toLowerCase().includes(query.toLowerCase())).slice(0, 30) : allT.slice(0, 24));
      setLoading(false);
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, me]);

  const showProjects = tab === "all" || tab === "projects";
  const showPeople = tab === "all" || tab === "people";
  const showTags = tab === "all" || tab === "tags";

  return (
    <div className="wrap section page-enter">
      <div style={{ maxWidth: 640, margin: "0 auto 24px" }}>
        <span className="eyebrow">🔎 search</span>
        <h1 className="section-title" style={{ marginBottom: 14 }}>Search</h1>
        <div style={{ position: "relative" }}>
          <FiSearch style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--cocoa-2)" }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search work, people, #tags…"
            style={{ width: "100%", padding: "12px 16px 12px 44px", borderRadius: 999, border: "1.5px solid var(--line)", fontSize: "1rem" }}
          />
        </div>
        <div className="muted" style={{ fontSize: "0.76rem", marginTop: 8 }}>
          engine: <b>{engine === "elasticsearch" ? "Elasticsearch" : "MongoDB (fallback)"}</b>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button key={t} className={"chip" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && projects.length === 0 && people.length === 0 ? (
        <PawLoader />
      ) : (
        <>
          {showPeople && people.length > 0 && (
            <section className="section-tight">
              <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: 14 }}>People</h2>
              <div className="trio">
                {people.slice(0, tab === "people" ? 60 : 6).map((c) => (
                  <Link key={c._id} href={`/Creators/${c.username}`} className="card card-hover person-card" style={{ textDecoration: "none", color: "inherit" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="avatar" src={c.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={c.displayName} width={48} height={48} style={{ borderRadius: "50%", border: "2px solid var(--pink)", flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="person-name">{c.displayName}</div>
                      <div className="person-sub">@{c.username}</div>
                      {c.headline && <div className="person-sub">{c.headline}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showTags && tags.length > 0 && (
            <section className="section-tight">
              <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: 14 }}>Tags</h2>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {tags.map((tg) => (
                  <Link key={tg} href={`/Tags/${encodeURIComponent(tg)}`} className="chip">
                    #{tg}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(tab === "all" || tab === "chats") && msgs.length > 0 && (
            <section className="section-tight">
              <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: 14 }}>
                <FiMessageCircle style={{ verticalAlign: "-3px" }} /> Your messages
              </h2>
              <div className="stack" style={{ gap: 8, maxWidth: 640 }}>
                {msgs.slice(0, tab === "chats" ? 30 : 5).map((m) => (
                  <Link
                    key={m.id}
                    href={`/Messages?to=${m.from === me?._id ? m.to : m.from}`}
                    className="card card-tight"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div style={{ fontSize: "0.92rem" }}>{m.text}</div>
                    <div className="muted" style={{ fontSize: "0.74rem", marginTop: 4 }}>
                      {m.from === me?._id ? "you sent this" : "you received this"}
                      {m.createdAt ? " · " + new Date(m.createdAt).toLocaleDateString() : ""}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showProjects && (
            <section className="section-tight">
              <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: 14 }}>{q.trim() ? "Work" : "Popular work"}</h2>
              {projects.length === 0 ? (
                <p className="muted">No matching work.</p>
              ) : (
                <div className="grid">
                  {projects.map((p) => (
                    <ProjectCard key={p._id} project={p} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
