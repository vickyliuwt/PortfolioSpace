"use client";

// Creators/[username]/page.tsx
// creator page

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiMapPin, FiGlobe, FiGithub, FiLinkedin, FiUserPlus, FiUserCheck, FiMail, FiHeart, FiEye, FiBriefcase, FiBookOpen, FiActivity, FiThumbsUp, FiTrash2, FiPrinter, FiSlash, FiLock, FiUsers } from "react-icons/fi";
import PawLoader from "../../../components/PawLoader";
import EmptyState from "../../../components/EmptyState";
import ContribGraph from "../../../components/ContribGraph";
import { useAppSelector } from "../../../store/hooks";
import { getCreator, isFollowing, toggleFollow, followCounts, getEndorsements, toggleEndorse, listRecommendations, addRecommendation, deleteRecommendation, myProfileViews, toggleBlock, isBlocked } from "../../Account/client";
import type { Recommendation, ProfileViewer } from "../../Account/client";
import { badgesFor } from "../../../lib/badges";
import { byCreator, publicCollections } from "../../Projects/client";
import type { Creator, Project, Collection, FollowCounts } from "../../../lib/types";
import { onAvatarError, onCoverError } from "../../../lib/img";

export default function CreatorPage() {
  const params = useParams();
  const username = String(params.username);

  const me = useAppSelector((s) => s.account.currentUser);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [counts, setCounts] = useState<FollowCounts>({ followers: 0, following: 0 });
  const [following, setFollowing] = useState(false);
  const [missing, setMissing] = useState(false);
  const [endorse, setEndorse] = useState<Record<string, { count: number; mine: boolean }>>({});
  const [recos, setRecos] = useState<Recommendation[] | null>(null);
  const [recoText, setRecoText] = useState("");
  const [recoBusy, setRecoBusy] = useState(false);
  const [views, setViews] = useState<{ total: number; viewers: ProfileViewer[] } | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let alive = true;
    getCreator(username)
      .then(async (c) => {
        if (!alive) return;
        setCreator(c);
        const [pros, cnt, cols, end, recs] = await Promise.all([
          byCreator(c._id),
          followCounts(c._id),
          publicCollections(c._id),
          getEndorsements(c._id),
          listRecommendations(c._id).catch(() => []),
        ]);
        if (!alive) return;
        setProjects(pros);
        setCounts(cnt);
        setCollections(cols);
        setEndorse(end);
        setRecos(recs);
        if (me && me._id !== c._id) isFollowing(c._id).then((f) => alive && setFollowing(f)).catch(() => {});
      })
      .catch(() => setMissing(true));
    return () => {
      alive = false;
    };
  }, [username, me]);

  // did i block this person
  useEffect(() => {
    if (!creator || !me || me._id === creator._id) return;
    isBlocked(creator._id).then(setBlocked).catch(() => {});
  }, [creator, me]);

  // my visitors, only on my own page
  useEffect(() => {
    if (!creator || !me || me._id !== creator._id) return;
    myProfileViews().then(setViews).catch(() => {});
  }, [creator, me]);

  const doFollow = async () => {
    if (!creator) return;
    const res = await toggleFollow(creator._id);
    setFollowing(res.following);
    setCounts((c) => ({ ...c, followers: c.followers + (res.following ? 1 : -1) }));
  };

  const onBlock = async () => {
    if (!creator) return;
    if (!blocked && !confirm(`Block ${creator.displayName}? You will not see each other any more.`)) return;
    const res = await toggleBlock(creator._id).catch(() => null);
    if (res) {
      setBlocked(res.blocked);
      if (res.blocked) setFollowing(false);
    }
  };

  const onEndorse = async (skill: string) => {
    if (!creator || !me) return;
    const res = await toggleEndorse(creator._id, skill).catch(() => null);
    if (res) setEndorse((old) => ({ ...old, [skill]: { count: res.count, mine: res.endorsed } }));
  };
  const submitReco = async () => {
    if (!creator || !me || !recoText.trim()) return;
    setRecoBusy(true);
    try {
      const rec = await addRecommendation(creator._id, recoText.trim());
      setRecos((old) => [rec, ...(old || [])]);
      setRecoText("");
    } catch {
      // ignore
    } finally {
      setRecoBusy(false);
    }
  };
  const removeReco = async (id: string) => {
    try {
      await deleteRecommendation(id);
      setRecos((old) => (old || []).filter((r) => r._id !== id));
    } catch {
      // ignore
    }
  };

  if (missing)
    return (
      <div className="wrap section center page-enter">
        <div style={{ fontSize: 54 }}>🐾</div>
        <h2 className="section-title" style={{ fontSize: "1.8rem" }}>Creator not found</h2>
      </div>
    );

  if (!creator) return <PawLoader />;

  const totalLikes = projects.reduce((n, p) => n + (p.likes || 0), 0);
  const totalViews = projects.reduce((n, p) => n + (p.views || 0), 0);
  const pinned = projects.filter((p) => p.featured);

  return (
    <div className="wrap section page-enter">
      {/* header */}
      <div className="card" style={{ marginBottom: 24, background: "linear-gradient(160deg,#fff,#fdeef0)" }}>
        <div className="row" style={{ gap: 20 }}>
          <img className="avatar"
            src={creator.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError}
            alt={creator.displayName}
            width={96}
            height={96}
            style={{ borderRadius: "50%", border: "4px solid " + (creator.openToWork ? "#3fae6a" : "#fff"), boxShadow: "var(--shadow)" }}
          />
          <div style={{ flex: 1 }}>
            <div className="spread" style={{ alignItems: "flex-start" }}>
              <div className="row" style={{ gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: "1.9rem" }}>{creator.displayName}</h1>
                {creator.plan === "PRO" && <span className="pill pill-pro">pro</span>}
                {creator.openToWork && <span className="pill" style={{ background: "#e4f5ea", color: "#2e7d4f" }}>Open to work</span>}
              </div>
              {me && me._id !== creator._id && (
                <div className="row" style={{ gap: 8 }}>
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
                  <Link href={`/Messages?to=${creator._id}`} className="btn btn-cream btn-sm">
                    <FiMail /> Message
                  </Link>
                </div>
              )}
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-cream btn-sm no-print" onClick={() => window.print()}>
                  <FiPrinter /> Save as PDF
                </button>
                {me && me._id !== creator._id && (
                  <button type="button" className={"btn btn-sm no-print " + (blocked ? "btn-pink" : "btn-cream")} onClick={onBlock}>
                    <FiSlash /> {blocked ? "Unblock" : "Block"}
                  </button>
                )}
              </div>
            </div>
            <div className="muted" style={{ fontWeight: 700 }}>@{creator.username}</div>
            <div className="row" style={{ gap: 22, marginTop: 8 }}>
              <span>
                <b style={{ color: "var(--cocoa)", fontSize: "1.05rem" }}>{projects.length}</b> <span className="muted" style={{ fontSize: "0.85rem" }}>posts</span>
              </span>
              <span>
                <b style={{ color: "var(--cocoa)", fontSize: "1.05rem" }}>{counts.followers}</b> <span className="muted" style={{ fontSize: "0.85rem" }}>followers</span>
              </span>
              <span>
                <b style={{ color: "var(--cocoa)", fontSize: "1.05rem" }}>{counts.following}</b> <span className="muted" style={{ fontSize: "0.85rem" }}>following</span>
              </span>
              <span>
                <b style={{ color: "var(--cocoa)", fontSize: "1.05rem" }}>{totalLikes}</b> <span className="muted" style={{ fontSize: "0.85rem" }}>likes</span>
              </span>
              <span>
                <b style={{ color: "var(--cocoa)", fontSize: "1.05rem" }}>{totalViews}</b> <span className="muted" style={{ fontSize: "0.85rem" }}>views</span>
              </span>
            </div>
            <p style={{ margin: "6px 0" }}>{creator.headline}</p>
            <div className="row muted" style={{ gap: 16, fontSize: "0.88rem" }}>
              {creator.location && (
                <span className="row" style={{ gap: 4 }}>
                  <FiMapPin /> {creator.location}
                </span>
              )}
              {creator.website && (
                <a href={creator.website} target="_blank" rel="noreferrer" className="row" style={{ gap: 4 }}>
                  <FiGlobe /> Website
                </a>
              )}
              {creator.socials?.github && (
                <a href={creator.socials.github} target="_blank" rel="noreferrer" className="row" style={{ gap: 4 }}>
                  <FiGithub /> GitHub
                </a>
              )}
              {creator.socials?.linkedin && (
                <a href={creator.socials.linkedin} target="_blank" rel="noreferrer" className="row" style={{ gap: 4 }}>
                  <FiLinkedin /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        {creator.bio && <p style={{ marginTop: 16, marginBottom: 8 }}>{creator.bio}</p>}
        {creator.skills?.length > 0 && (
          <div className="row" style={{ marginTop: 10, flexWrap: "wrap", gap: 8 }}>
            {creator.skills.map((sk) => {
              const e = endorse[sk] || { count: 0, mine: false };
              const canEndorse = me && me._id !== creator._id;
              return (
                <span key={sk} className="chip" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {sk}
                  {e.count > 0 && <b style={{ color: "var(--rose)" }}>{e.count}</b>}
                  {canEndorse && (
                    <button onClick={() => onEndorse(sk)} aria-label="Endorse" title={e.mine ? "Remove endorsement" : "Endorse"} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: e.mine ? "var(--rose)" : "var(--cocoa-2)" }}>
                      <FiThumbsUp size={13} style={{ fill: e.mine ? "var(--rose)" : "none" }} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {creator.locked && (
        <div className="card" style={{ textAlign: "center", padding: 40, marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>
            <FiLock />
          </div>
          <h3 style={{ margin: "0 0 6px" }}>This account is private</h3>
          <p className="muted" style={{ margin: 0 }}>Follow {creator.displayName} to see their work.</p>
        </div>
      )}

      {!creator.locked && (
      <>
      {/* badges */}
      {(() => {
        const list = badgesFor(creator, projects, counts.followers);
        if (!list.length) return null;
        return (
          <div className="card" style={{ marginBottom: 24 }}>
            <span className="eyebrow">🏅 badges</span>
            <h3 style={{ margin: "6px 0 12px" }}>Badges</h3>
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              {list.map((b) => (
                <span key={b.key} className="chip" title={b.note} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "1.05rem" }}>{b.emoji}</span> {b.label}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* my visitors */}
      {views && me && creator._id === me._id && (
        <div className="card" style={{ marginBottom: 24 }}>
          <span className="eyebrow">👀 visitors</span>
          <h3 style={{ margin: "6px 0 4px" }}>Who looked at your profile</h3>
          <p className="muted" style={{ margin: "0 0 12px", fontSize: "0.86rem" }}>{views.total} people so far</p>
          {views.viewers.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No visits yet.</p>
          ) : (
            <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
              {views.viewers.slice(0, 10).map((v) => (
                <Link key={v._id} href={`/Creators/${v.viewerUsername}`} className="person-card" style={{ textDecoration: "none", color: "inherit", width: 200 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="avatar avatar-sm" src={v.viewerAvatar || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={v.viewerName} />
                  <div>
                    <div className="person-name" style={{ fontSize: "0.88rem" }}>{v.viewerName}</div>
                    <div className="person-sub">@{v.viewerUsername}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* contributions (github-style) */}
      {projects.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <span className="eyebrow"><FiActivity /> activity</span>
          <h3 style={{ margin: "6px 0 12px" }}>Contributions</h3>
          <ContribGraph dates={projects.map((p) => p.createdAt || "")} />
        </div>
      )}

      {/* experience (linkedin-style) */}
      {creator.experience && creator.experience.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <span className="eyebrow"><FiBriefcase /> experience</span>
          <h3 style={{ margin: "6px 0 14px" }}>Experience</h3>
          <div className="stack" style={{ gap: 16 }}>
            {creator.experience.map((x, i) => (
              <div key={i}>
                <div style={{ fontWeight: 800 }}>
                  {x.role}
                  {x.company ? " · " + x.company : ""}
                </div>
                {x.period && <div className="muted" style={{ fontSize: "0.82rem" }}>{x.period}</div>}
                {x.description && <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>{x.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* education */}
      {creator.education && creator.education.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <span className="eyebrow"><FiBookOpen /> education</span>
          <h3 style={{ margin: "6px 0 14px" }}>Education</h3>
          <div className="stack" style={{ gap: 14 }}>
            {creator.education.map((x, i) => (
              <div key={i}>
                <div style={{ fontWeight: 800 }}>{x.school}</div>
                {x.degree && <div className="muted" style={{ fontSize: "0.85rem" }}>{x.degree}</div>}
                {x.period && <div className="muted" style={{ fontSize: "0.8rem" }}>{x.period}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* recommendations (linkedin-style) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <span className="eyebrow">💬 recommendations</span>
        <h3 style={{ margin: "6px 0 14px" }}>Recommendations</h3>
        {me && me._id !== creator._id && (
          <div style={{ marginBottom: recos && recos.length ? 18 : 0 }}>
            <textarea value={recoText} onChange={(e) => setRecoText(e.target.value)} placeholder={`Write a recommendation for ${creator.displayName}…`} maxLength={1000} style={{ width: "100%" }} />
            <button className="btn btn-pink btn-sm" onClick={submitReco} disabled={recoBusy || !recoText.trim()} style={{ marginTop: 8 }}>
              Post recommendation
            </button>
          </div>
        )}
        {recos === null ? (
          <p className="muted" style={{ margin: 0 }}>loading…</p>
        ) : recos.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No recommendations yet.</p>
        ) : (
          <div className="stack" style={{ gap: 14 }}>
            {recos.map((r) => (
              <div key={r._id} className="card card-tight" style={{ position: "relative" }}>
                <Link href={`/Creators/${r.authorUsername}`} className="row" style={{ gap: 10, textDecoration: "none", color: "inherit", marginBottom: 6 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="avatar" src={r.authorAvatar || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={r.authorName} width={32} height={32} style={{ borderRadius: "50%" }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>{r.authorName}</div>
                    <div className="muted" style={{ fontSize: "0.75rem" }}>@{r.authorUsername}</div>
                  </div>
                </Link>
                <p style={{ margin: 0, fontSize: "0.92rem" }}>{r.text}</p>
                {me && r.author === me._id && (
                  <button onClick={() => removeReco(r._id)} aria-label="Delete" style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: "var(--cocoa-2)", opacity: 0.5 }}>
                    <FiTrash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* pinned (github-style) */}
      {pinned.length > 0 && (
        <>
          <span className="eyebrow">📌 pinned</span>
          <h2 className="section-title" style={{ fontSize: "1.6rem", marginBottom: 16 }}>Pinned</h2>
          <div className="trio" style={{ marginBottom: 30 }}>
            {pinned.slice(0, 3).map((p) => (
              <Link key={p._id} href={`/Projects/${p._id}`} className="card card-hover" style={{ textDecoration: "none", color: "inherit", padding: 0, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.coverUrl || "/covers/cover-default.svg"} onError={onCoverError} alt={p.title} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                <div style={{ padding: 12 }}>
                  <span className="pill c-pink" style={{ fontSize: "0.68rem" }}>{p.category}</span>
                  <h3 style={{ margin: "8px 0 4px", fontSize: "1rem" }}>{p.title}</h3>
                  <div className="muted row" style={{ gap: 12, fontSize: "0.8rem" }}>
                    <span className="row" style={{ gap: 4 }}>
                      <FiHeart /> {p.likes}
                    </span>
                    <span className="row" style={{ gap: 4 }}>
                      <FiEye /> {p.views}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* work */}
      <span className="eyebrow">🎨 portfolio</span>
      <h2 className="section-title" style={{ fontSize: "1.6rem", marginBottom: 16 }}>Work</h2>
      {projects.length === 0 ? (
        <EmptyState emoji="🎨" title="No public work yet" hint="Check back soon." />
      ) : (
        <div className="ig-grid">
          {projects.map((p) => (
            <Link key={p._id} href={`/Projects/${p._id}`} className="ig-cell">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.coverUrl || "/covers/cover-default.svg"} onError={onCoverError} alt={p.title} loading="lazy" />
              {p.owner !== creator._id && (
                <span
                  className="pill c-sky"
                  style={{ position: "absolute", top: 8, left: 8, zIndex: 2, fontSize: "0.7rem" }}
                  title={`posted by @${p.ownerUsername}`}
                >
                  <FiUsers style={{ verticalAlign: "-2px" }} /> credited
                </span>
              )}
              <div className="ig-ov">
                <span className="row" style={{ gap: 5 }}>
                  <FiHeart style={{ fill: "#fff" }} /> {p.likes}
                </span>
                <span className="row" style={{ gap: 5 }}>
                  <FiEye /> {p.views}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {collections.length > 0 && (
        <>
          <span className="eyebrow" style={{ marginTop: 30, display: "block" }}>🗂️ collections</span>
          <h2 className="section-title" style={{ fontSize: "1.6rem", marginBottom: 16 }}>Collections</h2>
          <div className="grid">
            {collections.map((c) => (
              <Link key={c._id} href={`/Collections/${c._id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
                <span className="pill c-sky">{c.projects.length} items</span>
                <h3 style={{ margin: "8px 0 4px" }}>{c.title}</h3>
                {c.description && (
                  <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                    {c.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
      </>
      )}
    </div>
  );
}
