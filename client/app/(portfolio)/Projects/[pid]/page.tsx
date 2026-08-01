"use client";

// Projects/[pid]/page.tsx
// full project view + comments

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FiHeart, FiEye, FiEdit2, FiTrash2, FiExternalLink, FiSend, FiBookmark, FiGithub, FiGlobe, FiLink2, FiCheck, FiFolderPlus, FiCornerUpLeft, FiTwitter, FiLinkedin, FiSmile, FiFlag } from "react-icons/fi";
import PawLoader from "../../../components/PawLoader";
import GitHubCard from "../../../components/GitHubCard";
import Carousel from "../../../components/Carousel";
import MentionInput from "../../../components/MentionInput";
import MentionText from "../../../components/MentionText";
import { useAppSelector } from "../../../store/hooks";
import { catTile } from "../../../lib/format";
import {
  getProject,
  toggleLike,
  deleteProject,
  listComments,
  updateProject,
  addComment,
  deleteComment,
  reactComment,
  likeComment,
  fileReport,
  similarProjects,
  isSaved,
  toggleSave,
  myCollections,
  createCollection,
  addToCollection,
} from "../client";
import type { Project, Comment, Collection } from "../../../lib/types";
import { REACTIONS, kindMeta } from "../../../lib/types";
import { onAvatarError, onCoverError } from "../../../lib/img";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pid = String(params.pid);
  const me = useAppSelector((s) => s.account.currentUser);

  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [similar, setSimilar] = useState<Project[]>([]);

  const [showCol, setShowCol] = useState(false);
  const [cols, setCols] = useState<Collection[] | null>(null);
  const [newColTitle, setNewColTitle] = useState("");
  const [colNote, setColNote] = useState("");

  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    getProject(pid)
      .then((p) => {
        setProject(p);
        setLikes(p.likes);
        if (me) setLiked(p.likedBy?.includes(me._id));
      })
      .catch(() => setNotFound(true));
    listComments(pid).then(setComments).catch(() => setComments([]));
    if (me) isSaved(pid).then(setSaved).catch(() => {});
  }, [pid, me]);

  const isOwner = !!me && !!project && project.owner === me._id;
  const onTeam = !!me && !!project && (project.collaborators || []).some((c) => c.user === me._id);
  const canEdit = isOwner || onTeam;

  const like = async () => {
    if (!me) {
      router.push("/Account/Signin");
      return;
    }
    const res = await toggleLike(pid);
    setLikes(res.likes);
    setLiked(res.liked);
  };

  const save = async () => {
    if (!me) {
      router.push("/Account/Signin");
      return;
    }
    const res = await toggleSave(pid);
    setSaved(res.saved);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked, ignore
    }
  };

  // similar
  useEffect(() => {
    if (!pid) return;
    let alive = true;
    similarProjects(pid)
      .then((list) => alive && setSimilar(list))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pid]);

  // publish a draft
  const publish = async () => {
    setPublishing(true);
    try {
      const updated = await updateProject(pid, { status: "PUBLISHED" });
      setProject(updated);
    } catch {
      // ignore
    } finally {
      setPublishing(false);
    }
  };

  // social share (opens intent in a new tab)
  const shareX = () => {
    const url = encodeURIComponent(window.location.href);
    const t = encodeURIComponent(project?.title || "Check out this work");
    window.open(`https://twitter.com/intent/tweet?text=${t}&url=${url}`, "_blank", "noopener");
  };
  const shareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "noopener");
  };

  // flag a project for review
  const report = async () => {
    if (!me) {
      router.push("/Account/Signin");
      return;
    }
    const reason = window.prompt("What's wrong with this project? (optional)");
    if (reason === null) return; // cancelled
    try {
      await fileReport("project", pid, reason);
      alert("Thanks — we'll take a look.");
    } catch {
      alert("Could not send the report.");
    }
  };

  const openCollections = async () => {
    const next = !showCol;
    setShowCol(next);
    if (next && cols === null) {
      try {
        setCols(await myCollections());
      } catch {
        setCols([]);
      }
    }
  };

  const addTo = async (colId: string, colTitle: string) => {
    try {
      await addToCollection(colId, pid);
      setColNote(`Added to ${colTitle}`);
      setCols((old) => (old || []).map((c) => (c._id === colId ? { ...c, projects: [...c.projects, pid] } : c)));
    } catch {
      setColNote("could not add");
    }
    setTimeout(() => setColNote(""), 1600);
  };

  const quickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    try {
      const col = await createCollection({ title: newColTitle.trim() });
      await addToCollection(col._id, pid);
      setCols((old) => [{ ...col, projects: [pid] }, ...(old || [])]);
      setNewColTitle("");
      setColNote(`Added to ${col.title}`);
    } catch {
      setColNote("could not create");
    }
    setTimeout(() => setColNote(""), 1600);
  };

  const removeProject = async () => {
    if (!project) return;
    if (!confirm(`Delete "${project.title}"?`)) return;
    await deleteProject(pid);
    router.push("/Projects");
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const c = await addComment(pid, text.trim(), replyTo?.id || "");
      setComments((old) => [c, ...old]);
      setText("");
      setReplyTo(null);
    } finally {
      setPosting(false);
    }
  };

  const removeComment = async (id: string) => {
    await deleteComment(id);
    setComments((old) => old.filter((c) => c._id !== id && c.parent !== id));
  };

  // react
  const onLikeComment = async (id: string) => {
    if (!me) return;
    try {
      const res = await likeComment(id);
      setComments((old) =>
        old.map((c) =>
          c._id === id
            ? {
                ...c,
                likes: res.likes,
                likedBy: res.liked ? [...(c.likedBy || []), me._id] : (c.likedBy || []).filter((u) => u !== me._id),
              }
            : c
        )
      );
    } catch {
      // ignore
    }
  };

  const onReact = async (id: string, emoji: string) => {
    if (!me) return;
    try {
      const reactions = await reactComment(id, emoji);
      setComments((old) => old.map((c) => (c._id === id ? { ...c, reactions } : c)));
    } catch {
      // ignore
    }
  };

  const startReply = (c: Comment) => {
    setReplyTo({ id: c._id, name: c.authorUsername });
    setText((t) => (t.trim().startsWith("@") ? t : `@${c.authorUsername} `));
  };

  // render @mentions as links
  const renderText = (txt: string) => <MentionText text={txt} />;

  // one comment's header (avatar + name + delete)
  const commentHead = (c: Comment) => (
    <div className="spread">
      <div className="row" style={{ gap: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="avatar"
          src={c.authorAvatar || "/mascot/avatar-default.svg"} onError={onAvatarError}
          alt={c.authorName}
          width={36}
          height={36}
          style={{ borderRadius: "50%", border: "2px solid var(--pink)" }}
        />
        <div>
          <div style={{ fontWeight: 700, color: "var(--cocoa)" }}>{c.authorName}</div>
          <div className="muted" style={{ fontSize: "0.78rem" }}>@{c.authorUsername}</div>
        </div>
      </div>
      {me && c.author === me._id && (
        <button className="btn btn-danger btn-sm" onClick={() => removeComment(c._id)} aria-label="Delete comment">
          <FiTrash2 />
        </button>
      )}
    </div>
  );

  const likedByMe = (c: Comment) => !!me && (c.likedBy || []).includes(me._id);

  // reactions
  const reactionBar = (c: Comment) => {
    const rs = c.reactions || [];
    const counts = new Map<string, number>();
    const mine = new Set<string>();
    rs.forEach((r) => {
      counts.set(r.emoji, (counts.get(r.emoji) || 0) + 1);
      if (me && r.user === me._id) mine.add(r.emoji);
    });
    return (
      <div className="row" style={{ gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => onLikeComment(c._id)}
          disabled={!me}
          className="pill"
          aria-label={likedByMe(c) ? "Unlike comment" : "Like comment"}
          style={{
            cursor: me ? "pointer" : "default",
            border: "1.5px solid " + (likedByMe(c) ? "var(--rose)" : "transparent"),
            background: likedByMe(c) ? "var(--pink-wash)" : "var(--cream-2)",
            color: likedByMe(c) ? "var(--rose)" : "var(--cocoa)",
          }}
        >
          <FiHeart /> {c.likes || 0}
        </button>
        {[...counts.entries()].map(([emoji, n]) => (
          <button
            key={emoji}
            onClick={() => onReact(c._id, emoji)}
            disabled={!me}
            className="pill"
            style={{
              cursor: me ? "pointer" : "default",
              border: "1.5px solid " + (mine.has(emoji) ? "var(--rose)" : "transparent"),
              background: mine.has(emoji) ? "var(--pink-wash)" : "var(--cream-2)",
              color: "var(--cocoa)",
            }}
          >
            {emoji} {n}
          </button>
        ))}
        {me && (
          <div style={{ position: "relative" }}>
            <button className="btn btn-cream btn-sm" onClick={() => setPickerFor(pickerFor === c._id ? null : c._id)} aria-label="Add reaction">
              <FiSmile />
            </button>
            {pickerFor === c._id && (
              <div className="card" style={{ position: "absolute", zIndex: 5, top: "110%", left: 0, padding: 6, display: "flex", gap: 2 }}>
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(c._id, emoji);
                      setPickerFor(null);
                    }}
                    style={{ fontSize: "1.2rem", background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8, lineHeight: 1 }}
                    aria-label={"React " + emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // render a comment and its whole reply subtree (multi-level)
  const MAX_INDENT = 5;
  const renderComment = (c: Comment, depth: number) => {
    const kids = repliesOf(c._id);
    return (
      <div
        key={c._id}
        className="card card-tight"
        style={depth > 0 ? { marginTop: 10, marginLeft: Math.min(depth, MAX_INDENT) * 22, background: "var(--cream-2)" } : undefined}
      >
        {commentHead(c)}
        <p
          onDoubleClick={() => onReact(c._id, "\u2764\ufe0f")}
          title={me ? "Double-click to react" : undefined}
          style={{ margin: "8px 0 8px", cursor: me ? "pointer" : "inherit" }}
        >
          {renderText(c.text)}
        </p>
        <div className="row" style={{ gap: 8 }}>
          {reactionBar(c)}
          {me && (
            <button className="btn btn-cream btn-sm" onClick={() => startReply(c)}>
              <FiCornerUpLeft /> Reply
            </button>
          )}
        </div>
        {kids.map((k) => renderComment(k, depth + 1))}
      </div>
    );
  };

  const commentList = Array.isArray(comments) ? comments : [];
  const topComments = commentList.filter((c) => !c.parent);
  const repliesOf = (id: string) => commentList.filter((c) => c.parent === id);

  if (notFound)
    return (
      <div className="wrap section center page-enter">
        <div style={{ fontSize: 54 }}>🙈</div>
        <h2 className="section-title" style={{ fontSize: "1.8rem" }}>Project not found</h2>
        <Link href="/Discover" className="btn btn-pink" style={{ marginTop: 6 }}>Back to Discover</Link>
      </div>
    );

  if (!project) return <PawLoader />;

  return (
    <div className="wrap section page-enter" style={{ maxWidth: 900 }}>
      {/* header */}
      <div className="spread" style={{ marginBottom: 16, alignItems: "flex-start" }}>
        <div>
          <span className={"pill " + catTile(project.category, project.kind)}>{kindMeta(project.kind).emoji} {project.category}</span>
          <h1 className="section-title" style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)", margin: "10px 0 6px" }}>
            {project.title}
          </h1>
          <Link href={`/Creators/${project.ownerUsername}`} style={{ fontWeight: 700, color: "var(--rose)" }}>
            by {project.ownerName} · @{project.ownerUsername}
          </Link>
          {(project.collaborators || []).length > 0 && (
            <div style={{ marginTop: 5, fontSize: "0.9rem", fontWeight: 700, color: "var(--cocoa-2)" }}>
              with{" "}
              {(project.collaborators || []).map((c, i) => (
                <span key={c.user}>
                  {i > 0 && ", "}
                  <Link href={`/Creators/${c.username}`} style={{ color: "var(--sky-ink)" }} title={c.role || undefined}>
                    @{c.username}
                  </Link>
                  {c.role ? <span className="muted" style={{ fontWeight: 600 }}> ({c.role})</span> : null}
                </span>
              ))}
            </div>
          )}
          {(project.role || project.year) && (
            <div className="muted" style={{ fontSize: "0.9rem", fontWeight: 700, marginTop: 4 }}>
              {project.role}
              {project.role && project.year ? " · " : ""}
              {project.year}
            </div>
          )}
        </div>
        {canEdit && (
          <div className="row">
            <Link href={`/Projects/${pid}/Edit`} className="btn btn-cream btn-sm">
              <FiEdit2 /> Edit
            </Link>
            {isOwner && (
              <button className="btn btn-danger btn-sm" onClick={removeProject}>
                <FiTrash2 /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      {canEdit && project.status === "DRAFT" && (
        <div className="notice-box" style={{ marginBottom: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700 }}>✎ This is a draft — only the people on this project can see it.</span>
          <button className="btn btn-pink btn-sm" onClick={publish} disabled={publishing}>
            {publishing ? "publishing…" : "Publish now"}
          </button>
        </div>
      )}
      {canEdit && project.status !== "DRAFT" && project.visibility !== "PUBLIC" && (
        <p className="muted" style={{ fontWeight: 700, fontSize: "0.88rem", marginTop: 0, marginBottom: 16 }}>
          {project.visibility === "PRIVATE" ? "🔒 Private — only the people on this project can see it" : "👥 Followers only — visible to followers"}
        </p>
      )}

      {/* cover */}
      {project.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.coverUrl}
          onError={onCoverError}
          alt={project.title}
          style={{ width: "100%", borderRadius: "var(--radius)", border: "1.5px solid rgba(255,255,255,0.7)", boxShadow: "var(--shadow)", marginBottom: 18 }}
        />
      )}

      {/* actions */}
      <div className="row" style={{ marginBottom: 18 }}>
        <button className={"btn btn-sm " + (liked ? "btn-pink" : "btn-cream")} onClick={like}>
          <FiHeart /> {likes} {liked ? "liked" : "like"}
        </button>
        <span className="row" style={{ gap: 5, color: "var(--cocoa-2)", fontWeight: 700, fontSize: "0.9rem" }}>
          <FiEye /> {project.views} views
        </span>
        <button className={"btn btn-sm " + (saved ? "btn-pink" : "btn-cream")} onClick={save}>
          <FiBookmark /> {saved ? "saved" : "save"}
        </button>
        {project.repoUrl && (
          <a href={project.repoUrl} target="_blank" rel="noreferrer" className="btn btn-cream btn-sm">
            <FiGithub /> Code
          </a>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noreferrer" className="btn btn-cream btn-sm">
            <FiGlobe /> Live demo
          </a>
        )}
        {project.externalUrl && (
          <a href={project.externalUrl} target="_blank" rel="noreferrer" className="btn btn-cream btn-sm">
            <FiExternalLink /> External link
          </a>
        )}
        <button className="btn btn-cream btn-sm" onClick={copyLink}>
          {copied ? <FiCheck /> : <FiLink2 />} {copied ? "copied!" : "copy link"}
        </button>
        <button className="btn btn-cream btn-sm" onClick={shareX} aria-label="Share on X">
          <FiTwitter />
        </button>
        <button className="btn btn-cream btn-sm" onClick={shareLinkedIn} aria-label="Share on LinkedIn">
          <FiLinkedin />
        </button>
        {me && !canEdit && (
          <button className="btn btn-cream btn-sm" onClick={report} aria-label="Report">
            <FiFlag /> Report
          </button>
        )}
        {me && (
          <button className="btn btn-cream btn-sm" onClick={openCollections}>
            <FiFolderPlus /> Add to collection
          </button>
        )}
      </div>

      {/* add-to-collection panel */}
      {me && showCol && (
        <div className="card card-tight" style={{ marginBottom: 18 }}>
          {colNote && <div className="notice-box" style={{ marginBottom: 10 }}>{colNote}</div>}
          {cols === null ? (
            <p className="muted" style={{ margin: 0 }}>loading…</p>
          ) : (
            <>
              {cols.length > 0 && (
                <div className="stack" style={{ marginBottom: 10 }}>
                  {cols.map((c) => {
                    const has = c.projects.includes(pid);
                    return (
                      <div key={c._id} className="spread">
                        <span style={{ fontWeight: 700 }}>
                          {c.title} <span className="muted" style={{ fontWeight: 400 }}>· {c.projects.length}</span>
                        </span>
                        <button className="btn btn-cream btn-sm" onClick={() => addTo(c._id, c.title)} disabled={has}>
                          {has ? "added" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <form onSubmit={quickCreate} className="row" style={{ gap: 8 }}>
                <input
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="New collection name"
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1.5px solid var(--line)" }}
                />
                <button className="btn btn-primary btn-sm">Create + add</button>
              </form>
            </>
          )}
        </div>
      )}

      {/* summary + description */}
      {project.summary && <p style={{ fontSize: "1.08rem", fontWeight: 600, color: "var(--cocoa)" }}>{project.summary}</p>}
      {project.description && <p className="muted" style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{project.description}</p>}

      {/* live repo stats for code projects */}
      {project.repoUrl && <GitHubCard repoUrl={project.repoUrl} />}

      {/* key features */}
      {project.highlights && project.highlights.length > 0 && (
        <div style={{ margin: "10px 0 4px" }}>
          <h3 style={{ margin: "0 0 8px" }}>✨ Key features</h3>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
            {project.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {/* tags + tools */}
      {project.tags?.length > 0 && (
        <div className="row" style={{ margin: "16px 0 6px" }}>
          {project.tags.map((t) => (
            <Link key={t} href={`/Tags/${encodeURIComponent(t)}`} className="chip">
              #{t}
            </Link>
          ))}
        </div>
      )}
      {project.tools?.length > 0 && (
        <div style={{ margin: "6px 0 10px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span className="muted" style={{ fontSize: "0.88rem", fontWeight: 700, marginRight: 2 }}>Made with:</span>
          {project.tools.map((t) => (
            <span key={t} className="pill c-sky">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* gallery */}
      {project.media?.length > 0 && (
        <div style={{ margin: "24px 0" }}>
          <span className="eyebrow">🎬 gallery</span>
          <div style={{ marginTop: 10 }}>
            <Carousel items={project.media} />
          </div>
        </div>
      )}

      <div className="paw-divider" aria-hidden="true">
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
      </div>

      {/* more like this */}
      {similar.length > 0 && (
        <div style={{ margin: "30px 0" }}>
          <span className="eyebrow">✨ more like this</span>
          <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: 16 }}>Similar work</h2>
          <div className="trio">
            {similar.slice(0, 6).map((sp) => (
              <Link key={sp._id} href={`/Projects/${sp._id}`} className="card card-hover" style={{ padding: 0, overflow: "hidden", textDecoration: "none", color: "inherit" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sp.coverUrl || "/covers/cover-default.svg"} onError={onCoverError} alt={sp.title} loading="lazy" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                <div style={{ padding: 12 }}>
                  <span className="pill c-pink" style={{ fontSize: "0.68rem" }}>{kindMeta(sp.kind).emoji} {sp.category}</span>
                  <h3 style={{ margin: "8px 0 3px", fontSize: "0.98rem" }}>{sp.title}</h3>
                  <div className="muted" style={{ fontSize: "0.78rem" }}>@{sp.ownerUsername}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* comments */}
      <div>
        <span className="eyebrow">💬 feedback</span>
        <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: 14 }}>
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </h2>

        {me ? (
          <form onSubmit={postComment} style={{ marginBottom: 18 }}>
            {replyTo && (
              <div className="row" style={{ gap: 8, marginBottom: 8, fontSize: "0.85rem" }}>
                <span className="muted">
                  replying to <b>@{replyTo.name}</b>
                </span>
                <button
                  type="button"
                  className="btn btn-cream btn-sm"
                  onClick={() => {
                    setReplyTo(null);
                    setText("");
                  }}
                >
                  cancel
                </button>
              </div>
            )}
            <div className="row" style={{ alignItems: "flex-start" }}>
              <MentionInput
                value={text}
                onChange={setText}
                placeholder="Leave some kind words… use @name to mention"
                maxLength={500}
              />
              <button className="btn btn-pink" disabled={posting || !text.trim()}>
                <FiSend /> {replyTo ? "Reply" : "Post"}
              </button>
            </div>
          </form>
        ) : (
          <div className="notice-box" style={{ marginBottom: 18 }}>
            <Link href="/Account/Signin">Sign in</Link> to leave feedback.
          </div>
        )}

        <div className="stack">
          {topComments.length === 0 && <p className="muted">No comments yet — say hi 👋</p>}
          {topComments.map((c) => renderComment(c, 0))}
        </div>
      </div>
    </div>
  );
}
