"use client";

// Stories.tsx
// stories

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiX, FiPlus, FiChevronRight, FiSend, FiHeart } from "react-icons/fi";
import UploadWidget from "./UploadWidget";
import { useAppSelector } from "../store/hooks";
import { feed, discover, activeStories, createStory, voteStory } from "../(portfolio)/Projects/client";
import { sendMessage } from "../(portfolio)/Account/client";
import type { Project, MediaItem } from "../lib/types";
import { REACTIONS } from "../lib/types";
import type { Story as StoryDoc, StoryPoll, StoryVote } from "../(portfolio)/Projects/client";
import { onAvatarError } from "../lib/img";

interface Frame {
  id?: string;
  imageUrl: string;
  caption?: string;
  title?: string;
  projectId?: string;
  poll?: StoryPoll | null;
  votes?: StoryVote[];
}
interface Story {
  owner: string;
  ownerName: string;
  ownerUsername: string;
  ownerAvatar?: string;
  frames: Frame[];
}

const DURATION = 4600;

// the parent feed already fetched these, reuse them instead of asking again
export default function Stories({ ids, projects }: { ids: string[]; projects?: Project[] | null }) {
  const me = useAppSelector((s) => s.account.currentUser);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [open, setOpen] = useState(-1);
  const [frame, setFrame] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [pending, setPending] = useState<{ url: string; key: string }[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [beat, setBeat] = useState(0);
  const [reactToast, setReactToast] = useState("");
  const [pollKind, setPollKind] = useState<"none" | "poll" | "question">("none");
  const [pollQ, setPollQ] = useState("");
  const [pollA, setPollA] = useState("");
  const [pollB, setPollB] = useState("");
  const [answer, setAnswer] = useState("");
  const [voted, setVoted] = useState<Record<string, StoryVote[]>>({});
  const centerTapRef = useRef(0);
  const [reload, setReload] = useState(0);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [paused, setPaused] = useState(false);
  const [gen, setGen] = useState(0);
  const holdRef = useRef(0);

  useEffect(() => setMounted(true), []);

  // seen ring
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ps_seen_stories");
      if (raw) setSeen(new Set(JSON.parse(raw)));
    } catch {
      // ignore
    }
  }, []);
  const markSeen = (owner: string) => {
    setSeen((old) => {
      if (old.has(owner)) return old;
      const nx = new Set(old);
      nx.add(owner);
      try {
        localStorage.setItem("ps_seen_stories", JSON.stringify([...nx]));
      } catch {
        // ignore
      }
      return nx;
    });
  };

  // story frames
  const build = useCallback(
    (real: StoryDoc[], list: Project[]): Story[] => {
      if (real.length) {
        const m = new Map<string, Story>();
        for (const s of real) {
          if (me && s.owner === me._id) continue;
          if (!m.has(s.owner)) m.set(s.owner, { owner: s.owner, ownerName: s.ownerName, ownerUsername: s.ownerUsername, ownerAvatar: s.ownerAvatar, frames: [] });
          m.get(s.owner)!.frames.push({ id: s._id, imageUrl: s.imageUrl, caption: s.caption, poll: s.poll || null, votes: s.votes || [] });
        }
        return [...m.values()];
      }
      const m = new Map<string, Story>();
      for (const p of list) {
        if (me && p.owner === me._id) continue;
        if (!m.has(p.owner)) m.set(p.owner, { owner: p.owner, ownerName: p.ownerName, ownerUsername: p.ownerUsername, ownerAvatar: p.ownerAvatar, frames: [] });
        const st = m.get(p.owner)!;
        if (st.frames.length < 5) st.frames.push({ imageUrl: p.coverUrl || "/covers/cover-default.svg", caption: p.summary, title: p.title, projectId: p._id });
      }
      return [...m.values()].slice(0, 15);
    },
    [me]
  );

  useEffect(() => {
    if (projects === null) return; // parent is still loading, its list is coming
    let alive = true;
    (async () => {
      const [real, list] = await Promise.all([
        activeStories(ids).catch(() => [] as StoryDoc[]),
        projects ?? (ids.length ? feed(ids) : discover({ sort: "new" })).catch(() => [] as Project[]),
      ]);
      if (alive) setStories(build(real, list));
    })();
    return () => {
      alive = false;
    };
  }, [ids, build, reload, projects]);

  const close = useCallback(() => setOpen(-1), []);
  const openStory = (i: number) => {
    setOpen(i);
    setFrame(0);
    setPaused(false);
    if (stories[i]) markSeen(stories[i].owner);
  };

  const next = () => {
    const st = stories[open];
    if (!st) return setOpen(-1);
    if (frame < st.frames.length - 1) setFrame(frame + 1);
    else if (open < stories.length - 1) {
      setOpen(open + 1);
      setFrame(0);
    } else setOpen(-1);
  };
  const prev = () => {
    if (frame > 0) setFrame(frame - 1);
    else if (open > 0) {
      const pi = open - 1;
      setOpen(pi);
      setFrame(Math.max(0, stories[pi].frames.length - 1));
    }
  };

  // auto next
  useEffect(() => {
    if (open < 0 || paused) return;
    const st = stories[open];
    if (!st) {
      setOpen(-1);
      return;
    }
    const t = setTimeout(() => {
      if (frame < st.frames.length - 1) setFrame(frame + 1);
      else if (open < stories.length - 1) {
        setOpen(open + 1);
        setFrame(0);
      } else setOpen(-1);
    }, DURATION);
    return () => clearTimeout(t);
  }, [open, frame, stories, paused, gen]);

  // keys
  useEffect(() => {
    if (open < 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, frame, stories]);

  const onUploaded = (m: MediaItem) => setPending((old) => [...old, { url: m.url, key: m.key }]);

  const closeUpload = () => {
    setUploadOpen(false);
    setPending([]);
    setCaption("");
    setPollKind("none");
    setPollQ("");
    setPollA("");
    setPollB("");
  };
  // multi upload
  const postStory = async () => {
    if (!pending.length) return;
    try {
      const sticker: StoryPoll | null =
        pollKind === "none" || !pollQ.trim()
          ? null
          : { kind: pollKind, question: pollQ.trim(), options: pollKind === "poll" ? [pollA.trim(), pollB.trim()].filter(Boolean) : [] };
      for (const ph of pending) await createStory(ph.url, ph.key, caption, sticker);
    } catch {
      // ignore
    }
    closeUpload();
    setReload((r) => r + 1);
  };

  // story reply
  const sendReply = async () => {
    if (!cur || !me || !replyText.trim()) return;
    try {
      await sendMessage(cur.owner, replyText.trim());
      setReplyText("");
      setReplySent(true);
      setTimeout(() => setReplySent(false), 1600);
    } catch {
      // ignore
    }
  };

  // answer a sticker
  const onVote = async (frameId: string, option: number, text = "") => {
    if (!me) return;
    const res = await voteStory(frameId, option, text).catch(() => null);
    if (res) {
      setVoted((old) => ({ ...old, [frameId]: res.votes }));
      setAnswer("");
    }
  };

  // quick react
  const sendReaction = async (emoji: string) => {
    if (!cur || !me) return;
    setReactToast(emoji);
    setTimeout(() => setReactToast(""), 1400);
    try {
      await sendMessage(cur.owner, emoji);
    } catch {
      // ignore
    }
  };
  // double tap
  const heart = () => {
    setBeat((b) => b + 1);
    if (me && cur && cur.owner !== me._id) sendReaction("❤️");
  };
  const centerTap = () => {
    if (wasHold()) return;
    const now = Date.now();
    if (now - centerTapRef.current < 300) {
      centerTapRef.current = 0;
      heart();
    } else {
      centerTapRef.current = now;
    }
  };

  // hold pause
  const holdStart = () => {
    holdRef.current = Date.now();
    setPaused(true);
  };
  const holdEnd = () => {
    setPaused(false);
    setGen((g) => g + 1);
  };
  const wasHold = () => Date.now() - holdRef.current > 220;

  const cur = open >= 0 ? stories[open] : null;
  const curFrame = cur ? cur.frames[frame] : null;

  return (
    <>
      {/* row */}
      <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "4px 2px 16px", marginBottom: 6 }}>
        {me && (
          <button onClick={() => setUploadOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", flexShrink: 0, width: 68, padding: 0 }}>
            <div style={{ position: "relative", display: "inline-flex" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="avatar" src={me.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError} alt="You" width={60} height={60} style={{ borderRadius: "50%", border: "2.5px solid var(--line)", objectFit: "cover" }} />
              <span style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: "50%", background: "var(--rose)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--card)" }}>
                <FiPlus size={12} />
              </span>
            </div>
            <div className="muted" style={{ fontSize: "0.72rem", marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Your story</div>
          </button>
        )}

        {stories.map((st, i) => (
          <button key={st.owner} onClick={() => openStory(i)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", flexShrink: 0, width: 68, padding: 0 }}>
            <span className={"story-ring" + (seen.has(st.owner) ? " seen" : "")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={st.ownerAvatar || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={st.ownerName} width={58} height={58} />
            </span>
            <div className="muted" style={{ fontSize: "0.72rem", marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{st.ownerUsername}</div>
          </button>
        ))}
      </div>

      {/* fullscreen viewer (portal so it truly covers the screen) */}
      {mounted &&
        cur &&
        curFrame &&
        createPortal(
          <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(10,6,7,0.94)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={(e) => e.stopPropagation()} onPointerDown={holdStart} onPointerUp={holdEnd} onPointerLeave={holdEnd} style={{ position: "relative", width: "min(430px, 94vw)", height: "min(86vh, 820px)", borderRadius: 18, overflow: "hidden", background: "#000" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={curFrame.imageUrl} alt={curFrame.title || "story"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)", pointerEvents: "none" }} />
              {beat > 0 && <FiHeart key={beat} className="reel-heart" size={112} style={{ fill: "#fff", zIndex: 6 }} />}
              {reactToast && (
                <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center", zIndex: 6, color: "#fff", fontWeight: 800, fontSize: "1.4rem", textShadow: "0 1px 6px rgba(0,0,0,0.6)", pointerEvents: "none" }}>
                  {reactToast}
                </div>
              )}

              {/* progress bars */}
              <div style={{ position: "absolute", top: 10, left: 12, right: 12, display: "flex", gap: 4, zIndex: 3 }}>
                {cur.frames.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.35)", overflow: "hidden" }}>
                    {i < frame && <div style={{ height: "100%", width: "100%", background: "#fff", borderRadius: 999 }} />}
                    {i === frame && <div key={`${open}-${frame}-${gen}`} className="story-fill" style={{ animationPlayState: paused ? "paused" : "running" }} />}
                  </div>
                ))}
              </div>

              {/* author + close */}
              <div style={{ position: "absolute", top: 22, left: 14, right: 14, display: "flex", alignItems: "center", gap: 10, zIndex: 4 }}>
                <Link href={`/Creators/${cur.ownerUsername}`} onClick={close} className="row" style={{ gap: 8, textDecoration: "none", color: "#fff", flex: 1, minWidth: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="avatar" src={cur.ownerAvatar || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={cur.ownerName} width={34} height={34} style={{ borderRadius: "50%", border: "2px solid #fff" }} />
                  <span style={{ fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>@{cur.ownerUsername}</span>
                </Link>
                <button onClick={close} aria-label="Close" style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex" }}>
                  <FiX size={24} />
                </button>
              </div>

              {/* tap zones */}
              <div onClick={() => { if (!wasHold()) prev(); }} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "25%", zIndex: 2, cursor: "pointer" }} aria-label="Previous" />
              <div onClick={centerTap} style={{ position: "absolute", left: "25%", top: 0, bottom: 0, width: "50%", zIndex: 2, cursor: "pointer" }} aria-label="Like" />
              <div onClick={() => { if (!wasHold()) next(); }} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "25%", zIndex: 2, cursor: "pointer" }} aria-label="Next" />

              {curFrame.poll && curFrame.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ position: "absolute", left: 24, right: 24, top: "36%", zIndex: 5, background: "rgba(255,255,255,0.94)", borderRadius: 18, padding: 14, color: "var(--cocoa)" }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 10, fontFamily: "var(--display)" }}>{curFrame.poll.question}</div>
                  {(() => {
                    const fid = curFrame.id as string;
                    const list = voted[fid] || curFrame.votes || [];
                    const mine = me ? list.find((v) => v.user === me._id) : null;

                    if (curFrame.poll?.kind === "question") {
                      if (mine) return <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>Sent. Thanks!</p>;
                      return (
                        <div className="row" style={{ gap: 8 }}>
                          <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type an answer" maxLength={200} style={{ flex: 1 }} />
                          <button className="btn btn-pink btn-sm" disabled={!answer.trim()} onClick={() => onVote(fid, -1, answer)}>
                            <FiSend />
                          </button>
                        </div>
                      );
                    }

                    const total = list.length;
                    return (
                      <div className="stack" style={{ gap: 8 }}>
                        {(curFrame.poll?.options || []).map((opt, i) => {
                          const n = list.filter((v) => v.option === i).length;
                          const pct = total ? Math.round((n / total) * 100) : 0;
                          const picked = mine?.option === i;
                          return (
                            <button
                              key={i}
                              onClick={() => !mine && onVote(fid, i)}
                              disabled={!me || !!mine}
                              style={{ position: "relative", textAlign: "left", border: "1.5px solid " + (picked ? "var(--rose)" : "var(--line)"), background: "var(--cream-2)", borderRadius: 12, padding: "9px 12px", cursor: me && !mine ? "pointer" : "default", overflow: "hidden", fontWeight: 700, color: "var(--cocoa)" }}
                            >
                              {mine && <span style={{ position: "absolute", inset: 0, width: pct + "%", background: "var(--pink-wash)" }} />}
                              <span style={{ position: "relative" }}>
                                {opt}
                                {mine ? " - " + pct + "%" : ""}
                              </span>
                            </button>
                          );
                        })}
                        {mine && <div className="muted" style={{ fontSize: "0.78rem" }}>{total} {total === 1 ? "vote" : "votes"}</div>}
                        {!me && <div className="muted" style={{ fontSize: "0.78rem" }}>Sign in to vote.</div>}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* quick emoji reactions -> DM the author */}
              {me && cur.owner !== me._id && (
                <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} style={{ position: "absolute", left: 12, right: 12, bottom: 60, zIndex: 5, display: "flex", gap: 8, justifyContent: "center" }}>
                  {REACTIONS.map((e) => (
                    <button key={e} onClick={() => sendReaction(e)} style={{ fontSize: "1.4rem", background: "rgba(255,255,255,0.16)", border: "none", borderRadius: 999, width: 42, height: 42, cursor: "pointer", lineHeight: 1 }} aria-label={"React " + e}>
                      {e}
                    </button>
                  ))}
                </div>
              )}

              {/* reply -> DM the author */}
              {me && cur.owner !== me._id && (
                <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} style={{ position: "absolute", left: 12, right: 12, bottom: 14, zIndex: 5, display: "flex", gap: 8 }}>
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => setPaused(true)}
                    onBlur={() => { setPaused(false); setGen((g) => g + 1); }}
                    onKeyDown={(e) => { if (e.key === "Enter") sendReply(); }}
                    placeholder={replySent ? "Sent! 💌" : `Reply to @${cur.ownerUsername}…`}
                    style={{ flex: 1, padding: "9px 14px", borderRadius: 999, border: "none", background: "rgba(255,255,255,0.92)", color: "var(--cocoa)" }}
                  />
                  <button onClick={sendReply} className="btn btn-pink btn-sm" aria-label="Send reply" disabled={!replyText.trim()}>
                    <FiSend />
                  </button>
                </div>
              )}

              {/* caption */}
              <div style={{ position: "absolute", left: 16, right: 16, bottom: 104, color: "#fff", zIndex: 4, textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
                {curFrame.title && <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1.15rem" }}>{curFrame.title}</div>}
                {curFrame.caption && (
                  <p style={{ margin: "3px 0 8px", fontSize: "0.88rem", opacity: 0.94, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{curFrame.caption}</p>
                )}
                {curFrame.projectId && (
                  <button
                    onClick={() => {
                      const id = curFrame.projectId;
                      close();
                      router.push(`/Projects/${id}`);
                    }}
                    className="btn btn-pink btn-sm"
                  >
                    View project <FiChevronRight />
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* upload modal (portal) */}
      {mounted &&
        uploadOpen &&
        createPortal(
          <div onClick={closeUpload} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(20,12,14,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(420px, 94vw)" }}>
              <div className="spread" style={{ alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Add to your story</h3>
                <button onClick={closeUpload} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--cocoa)" }}>
                  <FiX size={22} />
                </button>
              </div>
              <p className="muted" style={{ marginTop: 0, fontSize: "0.86rem" }}>Photos disappear after 24 hours.</p>
              <div className="field">
                <label>Caption (optional)</label>
                <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="say something…" maxLength={200} />
              </div>
              {pending.length > 0 && (
                <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {pending.map((ph, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ph.url} alt="" width={64} height={64} style={{ objectFit: "cover", borderRadius: 10, border: "1.5px solid var(--line)", display: "block" }} />
                      <button
                        onClick={() => setPending((old) => old.filter((_, j) => j !== i))}
                        aria-label="Remove"
                        style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "var(--card)", color: "var(--cocoa)", border: "1.5px solid var(--line)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="field">
                <label>Sticker</label>
                <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                  {(["none", "poll", "question"] as const).map((k) => (
                    <button key={k} type="button" className={"chip" + (pollKind === k ? " active" : "")} onClick={() => setPollKind(k)}>
                      {k === "none" ? "None" : k === "poll" ? "Poll" : "Question"}
                    </button>
                  ))}
                </div>
                {pollKind !== "none" && (
                  <input
                    value={pollQ}
                    onChange={(e) => setPollQ(e.target.value)}
                    placeholder={pollKind === "poll" ? "Which one should i finish?" : "Ask me anything"}
                    maxLength={120}
                  />
                )}
                {pollKind === "poll" && (
                  <div className="row" style={{ gap: 8, marginTop: 8 }}>
                    <input value={pollA} onChange={(e) => setPollA(e.target.value)} placeholder="Option A" maxLength={40} style={{ flex: 1, minWidth: 110 }} />
                    <input value={pollB} onChange={(e) => setPollB(e.target.value)} placeholder="Option B" maxLength={40} style={{ flex: 1, minWidth: 110 }} />
                  </div>
                )}
              </div>

              <div className="row" style={{ gap: 8 }}>
                <UploadWidget label={pending.length ? "Add another" : "Add photo"} accept="image/*" onUploaded={onUploaded} />
                {pending.length > 0 && (
                  <button className="btn btn-pink btn-sm" onClick={postStory}>
                    Share {pending.length} photo{pending.length > 1 ? "s" : ""}
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
