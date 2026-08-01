"use client";

// FeedPost.tsx
// feed post

import { useRef, useState } from "react";
import Link from "next/link";
import { FiHeart, FiMessageCircle, FiBookmark, FiLink2, FiCheck, FiUserPlus, FiUserCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { addFollow, removeFollow } from "../store/followReducer";
import { toggleLike, toggleSave, listComments, addComment } from "../(portfolio)/Projects/client";
import { toggleFollow } from "../(portfolio)/Account/client";
import MentionInput from "./MentionInput";
import MentionText from "./MentionText";
import { kindMeta, formatCount } from "../lib/types";
import type { Project, Comment } from "../lib/types";
import { onAvatarError } from "../lib/img";

export default function FeedPost({ project }: { project: Project }) {
  const me = useAppSelector((s) => s.account.currentUser);
  const followIds = useAppSelector((s) => s.follow.ids);
  const dispatch = useAppDispatch();

  const lastTap = useRef(0);
  const [liked, setLiked] = useState(!!(me && project.likedBy?.includes(me._id)));
  const [likes, setLikes] = useState(project.likes);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [beat, setBeat] = useState(0);
  const [slide, setSlide] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [ctext, setCtext] = useState("");
  const [posting, setPosting] = useState(false);

  const media = project.media && project.media.length > 0 ? project.media : [];
  const multi = media.length > 1;
  const arrow = {
    position: "absolute" as const,
    top: "50%",
    transform: "translateY(-50%)",
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.9)",
    color: "var(--cocoa)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    zIndex: 2,
  };

  const kind = kindMeta(project.kind);
  const isOwner = !!me && project.owner === me._id;
  const following = followIds.includes(project.owner);
  const cover = project.coverUrl || "/covers/cover-default.svg";

  const onLike = async () => {
    if (!me) return;
    try {
      const r = await toggleLike(project._id);
      setLiked(r.liked);
      setLikes(r.likes);
    } catch {
      // ignore
    }
  };
  const onSave = async () => {
    if (!me) return;
    try {
      const r = await toggleSave(project._id);
      setSaved(r.saved);
    } catch {
      // ignore
    }
  };
  const onFollow = async () => {
    if (!me) return;
    try {
      const r = await toggleFollow(project.owner);
      dispatch(r.following ? addFollow(project.owner) : removeFollow(project.owner));
    } catch {
      // ignore
    }
  };
  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/Projects/${project._id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore
    }
  };
  const onDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setBeat((b) => b + 1);
      if (me && !liked) onLike();
    }
    lastTap.current = now;
  };

  const toggleComments = () => {
    setShowComments((v) => !v);
    if (comments === null) listComments(project._id).then(setComments).catch(() => setComments([]));
  };
  const addC = async () => {
    if (!me || !ctext.trim()) return;
    setPosting(true);
    try {
      const c = await addComment(project._id, ctext.trim());
      setComments((old) => [c, ...(old || [])]);
      setCtext("");
    } catch {
      // ignore
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 22 }}>
      {/* header */}
      <div className="spread" style={{ padding: "12px 14px", alignItems: "center" }}>
        <Link href={`/Creators/${project.ownerUsername}`} className="row" style={{ gap: 10, textDecoration: "none", color: "inherit", minWidth: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="avatar" src={project.ownerAvatar || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={project.ownerName} width={40} height={40} style={{ borderRadius: "50%", border: "2px solid var(--pink)" }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, lineHeight: 1.15 }}>{project.ownerName}</div>
            <div className="muted" style={{ fontSize: "0.78rem" }}>
              @{project.ownerUsername} · {kind.emoji} {project.category}
            </div>
          </div>
        </Link>
        {!isOwner && me && (
          <button className={"btn btn-sm " + (following ? "btn-cream" : "btn-pink")} onClick={onFollow}>
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
      </div>

      {/* media (double-tap to like; swipe if multiple) */}
      <div onClick={onDoubleTap} style={{ position: "relative", lineHeight: 0, background: "var(--cream-2)", cursor: "pointer" }}>
        {multi ? (
          <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", overflow: "hidden" }}>
            {media[slide].type === "video" ? (
              <video src={media[slide].url} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media[slide].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <button onClick={(e) => { e.stopPropagation(); setSlide((i) => (i - 1 + media.length) % media.length); }} aria-label="Previous" style={{ ...arrow, left: 8 }}>
              <FiChevronLeft />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setSlide((i) => (i + 1) % media.length); }} aria-label="Next" style={{ ...arrow, right: 8 }}>
              <FiChevronRight />
            </button>
            <span style={{ position: "absolute", top: 10, right: 12, background: "rgba(0,0,0,0.55)", color: "#fff", borderRadius: 999, padding: "2px 10px", fontSize: "0.78rem", fontWeight: 700 }}>
              {slide + 1} / {media.length}
            </span>
            <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", gap: 5, justifyContent: "center" }}>
              {media.map((_, idx) => (
                <span key={idx} style={{ width: 6, height: 6, borderRadius: "50%", background: idx === slide ? "#fff" : "rgba(255,255,255,0.55)" }} />
              ))}
            </div>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={project.title} loading="lazy" style={{ width: "100%", height: "auto", display: "block", maxHeight: 620, objectFit: "cover" }} />
        )}
        {beat > 0 && <FiHeart key={beat} className="reel-heart" size={116} style={{ fill: "#fff" }} />}
      </div>

      {/* actions */}
      <div style={{ padding: "12px 14px 4px" }}>
        <div className="spread" style={{ alignItems: "center" }}>
          <div className="row" style={{ gap: 16 }}>
            <button onClick={onLike} aria-label={liked ? "Unlike" : "Like"} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
              <FiHeart size={24} style={{ fill: liked ? "var(--rose)" : "none", color: liked ? "var(--rose)" : "var(--cocoa)" }} />
            </button>
            <button onClick={toggleComments} aria-label="Comments" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--cocoa)" }}>
              <FiMessageCircle size={23} />
            </button>
            <button onClick={onShare} aria-label="Share" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--cocoa)" }}>
              {copied ? <FiCheck size={23} /> : <FiLink2 size={23} />}
            </button>
          </div>
          <button onClick={onSave} aria-label={saved ? "Saved" : "Save"} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <FiBookmark size={23} style={{ fill: saved ? "var(--sun-ink)" : "none", color: saved ? "var(--sun-ink)" : "var(--cocoa)" }} />
          </button>
        </div>

        <div style={{ fontWeight: 800, marginTop: 8 }}>{formatCount(likes)} likes</div>

        <div style={{ marginTop: 4 }}>
          <Link href={`/Creators/${project.ownerUsername}`} style={{ fontWeight: 800, color: "var(--cocoa)", textDecoration: "none" }}>
            {project.ownerUsername}
          </Link>{" "}
          <Link href={`/Projects/${project._id}`} style={{ color: "var(--cocoa)", textDecoration: "none" }}>
            <b>{project.title}</b>
            {project.summary ? " — " + project.summary : ""}
          </Link>
        </div>

        {project.tags && project.tags.length > 0 && (
          <div style={{ marginTop: 6, color: "var(--rose)", fontWeight: 700, fontSize: "0.86rem" }}>
            {project.tags.slice(0, 4).map((t) => (
              <Link key={t} href={`/Tags/${encodeURIComponent(t)}`} style={{ color: "var(--rose)", textDecoration: "none", marginRight: 8 }}>
                #{t}
              </Link>
            ))}
          </div>
        )}

        <button onClick={toggleComments} className="muted" style={{ display: "block", marginTop: 8, fontSize: "0.85rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
          {showComments ? "Hide comments" : comments && comments.length ? `View ${comments.length} comments` : "Add a comment"}
        </button>

        {showComments && (
          <div style={{ marginTop: 10, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            {comments === null ? (
              <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>loading…</p>
            ) : comments.length === 0 ? (
              <p className="muted" style={{ fontSize: "0.85rem", margin: "0 0 8px" }}>No comments yet — be the first.</p>
            ) : (
              <div className="stack" style={{ gap: 7, marginBottom: 8 }}>
                {comments.slice(0, 6).map((c) => (
                  <div key={c._id} style={{ fontSize: "0.88rem", lineHeight: 1.4 }}>
                    <Link href={`/Creators/${c.authorUsername}`} style={{ fontWeight: 800, color: "var(--cocoa)", textDecoration: "none" }}>
                      {c.authorUsername}
                    </Link>{" "}
                    <MentionText text={c.text} />
                  </div>
                ))}
                {comments.length > 6 && (
                  <Link href={`/Projects/${project._id}`} className="muted" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                    View all {comments.length} comments →
                  </Link>
                )}
              </div>
            )}
            {me && (
              <div className="row" style={{ gap: 8 }}>
                <MentionInput value={ctext} onChange={setCtext} placeholder="Add a comment…" onEnter={addC} />
                <button className="btn btn-pink btn-sm" onClick={addC} disabled={posting || !ctext.trim()}>
                  Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
