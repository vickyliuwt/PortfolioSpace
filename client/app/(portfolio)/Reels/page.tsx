"use client";

// Reels/page.tsx
// reels

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiHeart,
  FiBookmark,
  FiMessageCircle,
  FiLink2,
  FiCheck,
  FiUserPlus,
  FiUserCheck,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";
import PawLoader from "../../components/PawLoader";
import EmptyState from "../../components/EmptyState";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { addFollow, removeFollow } from "../../store/followReducer";
import { reels, toggleLike, toggleSave } from "../Projects/client";
import { toggleFollow } from "../Account/client";
import { kindMeta, formatCount } from "../../lib/types";
import type { Project } from "../../lib/types";
import { onAvatarError, onCoverError } from "../../lib/img";

function Reel({
  project,
  index,
  containerRef,
  onActive,
}: {
  project: Project;
  index: number;
  containerRef: RefObject<HTMLDivElement | null>;
  onActive: (i: number) => void;
}) {
  const me = useAppSelector((s) => s.account.currentUser);
  const followIds = useAppSelector((s) => s.follow.ids);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const rootRef = useRef<HTMLDivElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const lastTap = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [liked, setLiked] = useState(!!(me && project.likedBy?.includes(me._id)));
  const [likes, setLikes] = useState(project.likes);
  const [saved, setSaved] = useState(false);
  const [muted, setMuted] = useState(true);
  const [copied, setCopied] = useState(false);
  const [beat, setBeat] = useState(0);

  const video = (project.media || []).find((m) => m.type === "video" || m.type === "gif");
  const isOwner = !!me && project.owner === me._id;
  const following = followIds.includes(project.owner);
  const kind = kindMeta(project.kind);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = vidRef.current;
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            onActive(index);
            if (v) v.play().catch(() => {});
          } else if (v) {
            v.pause();
          }
        });
      },
      { root: containerRef.current || null, threshold: [0, 0.6, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [containerRef, index, onActive]);

  const needAuth = () => {
    if (!me) {
      router.push("/Account/Signin");
      return true;
    }
    return false;
  };

  const onLike = async () => {
    if (needAuth()) return;
    try {
      const r = await toggleLike(project._id);
      setLiked(r.liked);
      setLikes(r.likes);
    } catch {
      // ignore
    }
  };
  const onSave = async () => {
    if (needAuth()) return;
    try {
      const r = await toggleSave(project._id);
      setSaved(r.saved);
    } catch {
      // ignore
    }
  };
  const onFollow = async () => {
    if (needAuth()) return;
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
  const toggleMute = () => {
    const v = vidRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };
  const togglePlay = () => {
    const v = vidRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  // tap actions
  const doubleLike = async () => {
    setBeat((b) => b + 1);
    if (!me || liked) return;
    try {
      const r = await toggleLike(project._id);
      setLiked(r.liked);
      setLikes(r.likes);
    } catch {
      // ignore
    }
  };
  const onMediaTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      lastTap.current = 0;
      doubleLike();
    } else {
      lastTap.current = now;
      tapTimer.current = setTimeout(() => {
        togglePlay();
        lastTap.current = 0;
      }, 300);
    }
  };

  return (
    <div
      ref={rootRef}
      style={{ position: "relative", height: "100%", scrollSnapAlign: "start", flex: "0 0 100%", background: "#0f0a0b" }}
    >
      {/* media (tap target) */}
      <div onClick={onMediaTap} style={{ position: "absolute", inset: 0, cursor: "pointer" }}>
        {video ? (
          <video
            ref={vidRef}
            src={video.url}
            poster={project.coverUrl || undefined}
            muted={muted}
            loop
            playsInline
            preload="metadata"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.coverUrl || "/covers/cover-default.svg"} onError={onCoverError} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        )}
      </div>

      {/* gradients top + bottom */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 38%), linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%)", pointerEvents: "none" }} />

      {/* double-tap heart */}
      {beat > 0 && <FiHeart key={beat} className="reel-heart" size={116} style={{ fill: "#fff" }} />}

      {/* top-left type pill */}
      <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 8, alignItems: "center", pointerEvents: "none" }}>
        <span style={{ background: "rgba(20,12,14,0.4)", backdropFilter: "blur(6px)", color: "#fff", borderRadius: 999, padding: "5px 12px", fontWeight: 800, fontSize: "0.78rem", fontFamily: "var(--display)" }}>
          {kind.emoji} {kind.label}
        </span>
      </div>

      {/* action rail */}
      <div style={{ position: "absolute", right: 12, bottom: 92, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <Link href={`/Creators/${project.ownerUsername}`} style={{ position: "relative", marginBottom: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="avatar" src={project.ownerAvatar || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={project.ownerName} width={48} height={48} style={{ borderRadius: "50%", border: "2.5px solid #fff", display: "block", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }} />
          {!isOwner && (
            <span
              onClick={(e) => {
                e.preventDefault();
                onFollow();
              }}
              style={{ position: "absolute", bottom: -9, left: "50%", transform: "translateX(-50%)", width: 22, height: 22, borderRadius: "50%", background: following ? "#fff" : "var(--rose)", color: following ? "var(--rose)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", cursor: "pointer" }}
              aria-label={following ? "Following" : "Follow"}
            >
              {following ? <FiUserCheck size={11} /> : <FiUserPlus size={11} />}
            </span>
          )}
        </Link>

        <button onClick={onLike} className="reel-action" aria-label={liked ? "Unlike" : "Like"}>
          <span className="reel-bubble">
            <FiHeart style={{ fill: liked ? "var(--rose)" : "none", color: liked ? "var(--rose)" : "#fff" }} />
          </span>
          {formatCount(likes)}
        </button>

        <button onClick={onSave} className="reel-action" aria-label={saved ? "Saved" : "Save"}>
          <span className="reel-bubble">
            <FiBookmark style={{ fill: saved ? "var(--sun-ink)" : "none", color: saved ? "var(--sun-ink)" : "#fff" }} />
          </span>
          save
        </button>

        <button onClick={() => router.push(`/Projects/${project._id}`)} className="reel-action" aria-label="Comments">
          <span className="reel-bubble">
            <FiMessageCircle />
          </span>
          view
        </button>

        <button onClick={onShare} className="reel-action" aria-label="Share">
          <span className="reel-bubble">{copied ? <FiCheck /> : <FiLink2 />}</span>
          {copied ? "copied" : "share"}
        </button>

        {video && (
          <button onClick={toggleMute} className="reel-action" aria-label={muted ? "Unmute" : "Mute"}>
            <span className="reel-bubble">{muted ? <FiVolumeX /> : <FiVolume2 />}</span>
          </button>
        )}
      </div>

      {/* caption */}
      <div style={{ position: "absolute", left: 16, right: 80, bottom: 22, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
        <Link href={`/Creators/${project.ownerUsername}`} style={{ color: "#fff", fontWeight: 800, textDecoration: "none" }}>
          @{project.ownerUsername}
        </Link>
        <Link href={`/Projects/${project._id}`} style={{ display: "block", color: "#fff", textDecoration: "none" }}>
          <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1.18rem", margin: "5px 0 2px" }}>{project.title}</div>
          {project.summary && (
            <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.94, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {project.summary}
            </p>
          )}
        </Link>
        {project.tags && project.tags.length > 0 && (
          <div style={{ marginTop: 7, fontSize: "0.82rem", fontWeight: 700, opacity: 0.92 }}>
            {project.tags.slice(0, 3).map((t) => `#${t}`).join("  ")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReelsPage() {
  const [items, setItems] = useState<Project[] | null>(null);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    reels()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="wrap section page-enter" style={{ maxWidth: 1160 }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <span className="eyebrow">🎬 reels</span>
        <h1 className="section-title" style={{ marginBottom: 2 }}>Reels</h1>
        <p className="section-sub" style={{ margin: 0 }}>Double-tap to love it. Landscape-friendly — nothing gets cut off.</p>
      </div>

      {items === null ? (
        <PawLoader />
      ) : items.length === 0 ? (
        <EmptyState emoji="🎬" title="No reels yet" hint="Publish work with a cover or a video and it shows up here." ctaHref="/Projects/New" ctaLabel="Add a project" />
      ) : (
        <div style={{ position: "relative" }}>
          {/* progress dots */}
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", zIndex: 3, display: "flex", flexDirection: "column", gap: 7, alignItems: "center", pointerEvents: "none" }}>
            {items.slice(0, 12).map((_, i) => (
              <span key={i} className={"reel-dot" + (i === active ? " on" : "")} />
            ))}
          </div>

          <div
            ref={containerRef}
            className="reel-frame"
            style={{ width: "100%", aspectRatio: "16 / 9", maxHeight: "88vh", overflowY: "auto", scrollSnapType: "y mandatory", display: "flex", flexDirection: "column", WebkitOverflowScrolling: "touch" }}
          >
            {items.map((p, i) => (
              <Reel key={p._id} project={p} index={i} containerRef={containerRef} onActive={setActive} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
