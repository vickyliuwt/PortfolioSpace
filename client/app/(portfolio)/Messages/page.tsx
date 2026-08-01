"use client";

// Messages/page.tsx
// thread list + conversation (polling, no websockets needed)

import { useEffect, useRef, useState, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiSend, FiShare2, FiX, FiSmile, FiTrash2 } from "react-icons/fi";
import ProtectedRoute from "../../components/ProtectedRoute";
import UploadWidget from "../../components/UploadWidget";
import VoiceRecorder from "../../components/VoiceRecorder";
import VoiceBubble from "../../components/VoiceBubble";
import { useAppSelector } from "../../store/hooks";
import { listThreads, getConversation, sendMessage, messageUserCard } from "../Account/client";
import { myProjects } from "../Projects/client";
import { pingTyping, getTyping, deleteMessage } from "../Account/client";
import type { MessageThread, DirectMessage, ChatUser, Project, MediaItem } from "../../lib/types";
import { STICKERS } from "../../lib/types";
import { onAvatarError, onCoverError } from "../../lib/img";

function Inner() {
  const me = useAppSelector((s) => s.account.currentUser);
  const params = useSearchParams();
  const initialTo = params.get("to") || "";

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [active, setActive] = useState<ChatUser | null>(null);
  const [msgs, setMsgs] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [picker, setPicker] = useState(false);
  const [myProjs, setMyProjs] = useState<Project[] | null>(null);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const lastPingRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const loadThreads = () => listThreads().then(setThreads).catch(() => {});

  useEffect(() => {
    loadThreads();
    const t = setInterval(loadThreads, 20000);
    return () => clearInterval(t);
  }, []);

  const open = async (u: ChatUser) => {
    setActive(u);
    const conv = await getConversation(u.userId).catch(() => []);
    setMsgs(conv);
    loadThreads();
  };

  // pre-open a conversation from ?to=<userId>
  useEffect(() => {
    if (!initialTo) return;
    (async () => {
      const card = await messageUserCard(initialTo);
      if (card) open(card);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTo]);

  // poll the open conversation
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => getConversation(active.userId).then(setMsgs).catch(() => {}), 6000);
    return () => clearInterval(t);
  }, [active]);

  // typing poll
  useEffect(() => {
    if (!active) {
      setOtherTyping(false);
      return;
    }
    const t = setInterval(() => getTyping(active.userId).then(setOtherTyping).catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [active]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const body = text.trim();
    setText("");
    const msg = await sendMessage(active.userId, body).catch(() => null);
    if (msg) {
      setMsgs((old) => [...old, msg]);
      loadThreads();
    }
  };

  const sendImage = async (m: MediaItem) => {
    if (!active) return;
    const msg = await sendMessage(active.userId, "", { imageUrl: m.url, imageKey: m.key }).catch(() => null);
    if (msg) {
      setMsgs((old) => [...old, msg]);
      loadThreads();
    }
  };
  const openPicker = () => {
    setPicker(true);
    if (myProjs === null) myProjects().then(setMyProjs).catch(() => setMyProjs([]));
  };
  const sendProject = async (p: Project) => {
    if (!active) return;
    setPicker(false);
    const msg = await sendMessage(active.userId, "", { project: { id: p._id, title: p.title, cover: p.coverUrl || "", owner: p.ownerUsername } }).catch(() => null);
    if (msg) {
      setMsgs((old) => [...old, msg]);
      loadThreads();
    }
  };
  const sendVoice = async (url: string, key: string, secs: number) => {
    if (!active) return;
    const msg = await sendMessage(active.userId, "", { audioUrl: url, audioKey: key, audioSecs: secs }).catch(() => null);
    if (msg) {
      setMsgs((old) => [...old, msg]);
      loadThreads();
    }
  };
  const sendSticker = async (emoji: string) => {
    if (!active) return;
    setStickerOpen(false);
    const msg = await sendMessage(active.userId, "", { sticker: emoji }).catch(() => null);
    if (msg) {
      setMsgs((old) => [...old, msg]);
      loadThreads();
    }
  };
  const removeMsg = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteMessage(id);
      setMsgs((old) => old.filter((m) => m._id !== id));
      loadThreads();
    } catch {
      // ignore
    }
  };

  return (
    <div className="wrap section page-enter">
      <span className="eyebrow">💌 messages</span>
      <h1 className="section-title" style={{ marginBottom: 16 }}>Chat</h1>

      <div className="chat-grid">
        {/* threads */}
        <div className="card" style={{ padding: 8, height: 560, overflowY: "auto" }}>
          {threads.length === 0 ? (
            <p className="muted" style={{ padding: 12, margin: 0 }}>
              No conversations yet. Open a creator and tap Message.
            </p>
          ) : (
            threads.map((t) => (
              <button
                key={t.userId}
                onClick={() => open(t)}
                style={{
                  display: "flex",
                  gap: 10,
                  width: "100%",
                  textAlign: "left",
                  padding: 10,
                  borderRadius: 14,
                  border: "none",
                  background: active?.userId === t.userId ? "var(--cream-2)" : "transparent",
                  cursor: "pointer",
                  alignItems: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="avatar" src={t.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={t.name} width={40} height={40} style={{ borderRadius: "50%" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="spread">
                    <b style={{ fontSize: "0.92rem" }}>{t.name}</b>
                    {t.unread > 0 && <span className="pill c-pink" style={{ fontSize: "0.62rem" }}>{t.unread}</span>}
                  </div>
                  <div className="muted" style={{ fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.fromMe ? "You: " : ""}
                    {t.last}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* conversation */}
        <div className="card" style={{ display: "flex", flexDirection: "column", height: 560, padding: 0 }}>
          {!active ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: 24,
              }}
            >
              <div style={{ fontSize: 42, marginBottom: 10 }}>💌</div>
              <h3 style={{ margin: "0 0 4px", color: "var(--cocoa)" }}>Pick a conversation</h3>
              <p className="muted" style={{ margin: 0, maxWidth: 300 }}>
                Choose someone on the left, or message a creator from their page.
              </p>
            </div>
          ) : (
            <>
              <div style={{ padding: "12px 16px", borderBottom: "1.5px solid var(--line)" }}>
                <Link href={`/Creators/${active.username}`} className="row" style={{ gap: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="avatar" src={active.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError} alt={active.name} width={34} height={34} style={{ borderRadius: "50%" }} />
                  <b>{active.name}</b>
                </Link>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {msgs.map((m) => {
                  const mine = m.from === me?._id;
                  const isSticker = !!m.sticker;
                  const isMedia = !!(m.imageUrl || m.project || m.audioUrl);
                  return (
                    <div key={m._id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "80%", display: "flex", alignItems: "center", gap: 6, flexDirection: mine ? "row-reverse" : "row" }}>
                      <div
                        style={{
                          background: isSticker ? "transparent" : mine ? "var(--pink)" : "var(--cream-2)",
                          color: mine ? "#fff" : "var(--cocoa)",
                          padding: isSticker ? 0 : isMedia ? 5 : "9px 13px",
                          borderRadius: 16,
                          fontSize: isSticker ? "3rem" : "0.92rem",
                          lineHeight: isSticker ? 1 : 1.45,
                        }}
                      >
                      {m.sticker ? (
                        <span>{m.sticker}</span>
                      ) : m.audioUrl ? (
                        <VoiceBubble src={m.audioUrl} secs={m.audioSecs} mine={mine} />
                      ) : m.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.imageUrl} alt="" style={{ maxWidth: 220, width: "100%", borderRadius: 12, display: "block" }} />
                      ) : m.project ? (
                        <Link href={`/Projects/${m.project.id}`} style={{ display: "block", textDecoration: "none", color: "inherit", width: 190 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.project.cover || "/covers/cover-default.svg"} alt={m.project.title} style={{ width: "100%", borderRadius: 10, display: "block" }} />
                          <div style={{ fontWeight: 800, margin: "5px 6px 0", fontSize: "0.85rem" }}>{m.project.title}</div>
                          <div style={{ fontSize: "0.72rem", opacity: 0.8, margin: "0 6px 5px" }}>@{m.project.owner}</div>
                        </Link>
                      ) : (
                        m.text
                      )}
                      </div>
                      {mine && (
                        <button onClick={() => removeMsg(m._id)} aria-label="Delete message" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cocoa-2)", opacity: 0.4, padding: 2, flexShrink: 0 }}>
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
                {(() => {
                  const last = msgs[msgs.length - 1];
                  if (last && last.from === me?._id) {
                    return (
                      <div style={{ alignSelf: "flex-end", fontSize: "0.72rem", color: "var(--cocoa-2)", marginRight: 4 }}>
                        {last.read ? "Seen" : "Sent"}
                      </div>
                    );
                  }
                  return null;
                })()}
                {otherTyping && (
                  <div style={{ alignSelf: "flex-start", background: "var(--cream-2)", padding: "11px 14px", borderRadius: 16, display: "flex", gap: 4, alignItems: "center" }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
                    <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
                  </div>
                )}
                <div ref={endRef} />
              </div>
              <div style={{ borderTop: "1.5px solid var(--line)", padding: 12 }}>
                <div className="row" style={{ gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <UploadWidget label="Photo" accept="image/*" onUploaded={sendImage} />
                  <button type="button" className="btn btn-cream btn-sm" onClick={openPicker}>
                    <FiShare2 /> Project
                  </button>
                  <VoiceRecorder onRecorded={sendVoice} />
                  <div style={{ position: "relative" }}>
                    <button type="button" className="btn btn-cream btn-sm" onClick={() => setStickerOpen((v) => !v)} aria-label="Stickers">
                      <FiSmile /> Sticker
                    </button>
                    {stickerOpen && (
                      <div className="card" style={{ position: "absolute", bottom: "115%", left: 0, zIndex: 20, padding: 8, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, width: 214 }}>
                        {STICKERS.map((e) => (
                          <button key={e} type="button" onClick={() => sendSticker(e)} style={{ fontSize: "1.7rem", background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8, lineHeight: 1 }} aria-label={"Send " + e}>
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <form onSubmit={send} className="row" style={{ gap: 8 }}>
                  <input
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      const now = Date.now();
                      if (active && now - lastPingRef.current > 2000) {
                        lastPingRef.current = now;
                        pingTyping(active.userId);
                      }
                    }}
                    placeholder="Write a message…"
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 999, border: "1.5px solid var(--line)" }}
                  />
                  <button className="btn btn-pink btn-sm" disabled={!text.trim()} aria-label="send">
                    <FiSend />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {mounted &&
        picker &&
        createPortal(
          <div onClick={() => setPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(20,12,14,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(520px, 94vw)", maxHeight: "80vh", overflowY: "auto" }}>
              <div className="spread" style={{ alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Share a project</h3>
                <button onClick={() => setPicker(false)} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--cocoa)" }}>
                  <FiX size={22} />
                </button>
              </div>
              {myProjs === null ? (
                <p className="muted" style={{ margin: 0 }}>loading…</p>
              ) : myProjs.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>You have no projects to share yet.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {myProjs.map((p) => (
                    <button key={p._id} onClick={() => sendProject(p)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.coverUrl || "/covers/cover-default.svg"} onError={onCoverError} alt={p.title} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 10, display: "block" }} />
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--cocoa)" }}>{p.title}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <Inner />
      </Suspense>
    </ProtectedRoute>
  );
}
