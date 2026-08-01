"use client";

// ProjectForm.tsx
// shared by New + Edit

import { useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import UploadWidget from "./UploadWidget";
import CollaboratorPicker from "./CollaboratorPicker";
import { useAppSelector } from "../store/hooks";
import { KINDS, categoriesForKind } from "../lib/types";
import type { Project, MediaItem, Collaborator } from "../lib/types";
import { onCoverError } from "../lib/img";

export interface ProjectFormValues {
  kind: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  tags: string;
  tools: string;
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
  status: "PUBLISHED" | "DRAFT";
  role: string;
  highlights: string;
  year: string;
  externalUrl: string;
  repoUrl: string;
  demoUrl: string;
  coverUrl: string;
  coverKey: string;
  media: MediaItem[];
  collaborators: Collaborator[];
}

function toValues(p?: Partial<Project>): ProjectFormValues {
  const kind = p?.kind || "art";
  return {
    kind,
    title: p?.title || "",
    summary: p?.summary || "",
    description: p?.description || "",
    category: p?.category || categoriesForKind(kind)[0] || "Other",
    tags: (p?.tags || []).join(", "),
    tools: (p?.tools || []).join(", "),
    visibility: (p?.visibility as "PUBLIC" | "FRIENDS" | "PRIVATE") || "PUBLIC",
    status: (p?.status as "PUBLISHED" | "DRAFT") || "PUBLISHED",
    role: p?.role || "",
    highlights: (p?.highlights || []).join(", "),
    year: p?.year || "",
    externalUrl: p?.externalUrl || "",
    repoUrl: p?.repoUrl || "",
    demoUrl: p?.demoUrl || "",
    coverUrl: p?.coverUrl || "",
    coverKey: p?.coverKey || "",
    media: p?.media || [],
    collaborators: p?.collaborators || [],
  };
}

export default function ProjectForm({
  initial,
  submitLabel,
  onSubmit,
  busy,
}: {
  initial?: Partial<Project>;
  submitLabel: string;
  onSubmit: (payload: Partial<Project>) => void;
  busy?: boolean;
}) {
  const [v, setV] = useState<ProjectFormValues>(toValues(initial));
  const [err, setErr] = useState("");
  const me = useAppSelector((s) => s.account.currentUser);

  // owner keeps the list
  const canCredit = !initial?.owner || initial.owner === me?._id;

  const set = <K extends keyof ProjectFormValues>(k: K, val: ProjectFormValues[K]) =>
    setV((old) => ({ ...old, [k]: val }));

  const addMedia = (m: MediaItem) => set("media", [...v.media, m]);
  const removeMedia = (key: string) => set("media", v.media.filter((m) => m.key !== key));
  const dragRef = useRef<number | null>(null);
  const moveMedia = (from: number | null, to: number) => {
    if (from === null || from === to) return;
    setV((old) => {
      const arr = [...old.media];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return { ...old, media: arr };
    });
    dragRef.current = null;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.title.trim()) {
      setErr("please give it a title");
      return;
    }
    setErr("");
    onSubmit({
      kind: v.kind,
      title: v.title.trim(),
      summary: v.summary.trim(),
      description: v.description.trim(),
      category: v.category,
      tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
      tools: v.tools.split(",").map((t) => t.trim()).filter(Boolean),
      visibility: v.visibility,
      status: v.status,
      role: v.role.trim(),
      highlights: v.highlights.split(",").map((h) => h.trim()).filter(Boolean),
      year: v.year.trim(),
      externalUrl: v.externalUrl.trim(),
      repoUrl: v.repoUrl.trim(),
      demoUrl: v.demoUrl.trim(),
      coverUrl: v.coverUrl,
      coverKey: v.coverKey,
      media: v.media,
      collaborators: v.collaborators,
    });
  };

  return (
    <form onSubmit={submit} className="card" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {err && <div className="error-box" style={{ marginBottom: 10 }}>{err}</div>}

      <div className="field">
        <label>What kind of work is this?</label>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {KINDS.map((k) => (
            <button
              type="button"
              key={k.key}
              onClick={() => setV((old) => ({ ...old, kind: k.key, category: categoriesForKind(k.key)[0] || "Other" }))}
              className={"chip" + (v.kind === k.key ? " active" : "")}
              style={{ fontSize: "0.9rem" }}
              title={k.blurb}
            >
              <span style={{ fontSize: "1.05rem" }}>{k.emoji}</span> {k.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Title</label>
        <input value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Aurora — Short Film Reel" />
      </div>

      <div className="field">
        <label>Short summary</label>
        <input value={v.summary} onChange={(e) => set("summary", e.target.value)} placeholder="One line about this piece" maxLength={280} />
      </div>

      <div className="field">
        <label>Description</label>
        <textarea value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="Tell the story, tools, process…" />
      </div>

      <div className="row" style={{ gap: 14 }}>
        <div className="field" style={{ flex: 2, minWidth: 200 }}>
          <label>Your role (optional)</label>
          <input value={v.role} onChange={(e) => set("role", e.target.value)} placeholder="Solo project · or 'Backend lead, team of 4'" />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 110 }}>
          <label>Year (optional)</label>
          <input value={v.year} onChange={(e) => set("year", e.target.value)} placeholder="2026" />
        </div>
      </div>

      {canCredit ? (
        <CollaboratorPicker
          value={v.collaborators}
          onChange={(list) => set("collaborators", list)}
          meId={me?._id}
        />
      ) : (
        v.collaborators.length > 0 && (
          <div className="field">
            <label>Team credits</label>
            <p className="muted" style={{ fontSize: "0.78rem", margin: "0 0 8px" }}>
              Only the person who posted this can change who is credited.
            </p>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {v.collaborators.map((c) => (
                <span key={c.user} className="chip">
                  @{c.username}
                  {c.role ? ` - ${c.role}` : ""}
                </span>
              ))}
            </div>
          </div>
        )
      )}

      <div className="row" style={{ gap: 14 }}>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label>Category</label>
          <select value={v.category} onChange={(e) => set("category", e.target.value)}>
            {(categoriesForKind(v.kind).includes(v.category)
              ? categoriesForKind(v.kind)
              : [v.category, ...categoriesForKind(v.kind)]
            ).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label>Who can see it</label>
          <select value={v.visibility} onChange={(e) => set("visibility", e.target.value as "PUBLIC" | "FRIENDS" | "PRIVATE")}>
            <option value="PUBLIC">Public — show in Discover</option>
            <option value="FRIENDS">Followers — only people who follow me</option>
            <option value="PRIVATE">Private — only me</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label>Status</label>
        <div className="spread" style={{ alignItems: "center", border: "1.5px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "10px 14px" }}>
          <div>
            <div style={{ fontWeight: 700, color: "var(--cocoa)" }}>Save as draft</div>
            <div className="muted" style={{ fontSize: "0.82rem" }}>Only you can see it until you publish.</div>
          </div>
          <span
            role="switch"
            aria-checked={v.status === "DRAFT"}
            tabIndex={0}
            onClick={() => set("status", v.status === "DRAFT" ? "PUBLISHED" : "DRAFT")}
            style={{
              width: 44,
              height: 26,
              borderRadius: 999,
              cursor: "pointer",
              flexShrink: 0,
              background: v.status === "DRAFT" ? "var(--rose)" : "var(--line)",
              border: "1px solid " + (v.status === "DRAFT" ? "var(--rose)" : "var(--line)"),
              position: "relative",
              transition: "background 0.2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: v.status === "DRAFT" ? 20 : 2,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s",
              }}
            />
          </span>
        </div>
      </div>

      <div className="field">
        <label>Tags (comma separated)</label>
        <input value={v.tags} onChange={(e) => set("tags", e.target.value)} placeholder="2d, loop, cozy" />
      </div>

      <div className="field">
        <label>Tools / tech stack (comma separated)</label>
        <input value={v.tools} onChange={(e) => set("tools", e.target.value)} placeholder="React, Node, MongoDB" />
      </div>

      <div className="field">
        <label>Key features (comma separated)</label>
        <input value={v.highlights} onChange={(e) => set("highlights", e.target.value)} placeholder="Realtime sync, OAuth login, 90% test coverage" />
      </div>

      <div className="field">
        <label>External link (optional)</label>
        <input value={v.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://youtu.be/…" />
      </div>

      <div className="row" style={{ gap: 14 }}>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label>Code repo (optional)</label>
          <input value={v.repoUrl} onChange={(e) => set("repoUrl", e.target.value)} placeholder="https://github.com/you/repo" />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label>Live demo (optional)</label>
          <input value={v.demoUrl} onChange={(e) => set("demoUrl", e.target.value)} placeholder="https://your-demo.app" />
        </div>
      </div>

      {/* cover */}
      <div className="field">
        <label>Cover image</label>
        <div className="row">
          {v.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.coverUrl} onError={onCoverError} alt="cover" width={120} height={90} style={{ objectFit: "cover", borderRadius: 12, border: "1.5px solid var(--line)" }} />
          )}
          <UploadWidget
            label={v.coverUrl ? "Replace cover" : "Upload cover"}
            accept="image/*"
            onUploaded={(m) => setV((old) => ({ ...old, coverUrl: m.url, coverKey: m.key }))}
          />
        </div>
      </div>

      {/* gallery */}
      <div className="field">
        <label>Gallery (images / reels)</label>
        {v.media.length > 1 && <p className="muted" style={{ fontSize: "0.78rem", margin: "0 0 8px" }}>Drag thumbnails to reorder.</p>}
        <div className="row" style={{ marginBottom: 10, flexWrap: "wrap" }}>
          {v.media.map((m, i) => (
            <div
              key={m.key}
              draggable
              onDragStart={() => (dragRef.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => moveMedia(dragRef.current, i)}
              style={{ position: "relative", cursor: "grab" }}
              title="Drag to reorder"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt="" width={90} height={70} style={{ objectFit: "cover", borderRadius: 10, border: "1.5px solid var(--line)", display: "block", pointerEvents: "none" }} />
              <span style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: 6, fontSize: "0.65rem", fontWeight: 700, padding: "1px 6px" }}>{i + 1}</span>
              <button
                type="button"
                onClick={() => removeMedia(m.key)}
                aria-label="remove"
                style={{ position: "absolute", top: -8, right: -8, background: "var(--card)", color: "var(--cocoa)", border: "1.5px solid var(--line)", borderRadius: "50%", width: 24, height: 24, cursor: "pointer" }}
              >
                <FiX size={13} />
              </button>
            </div>
          ))}
        </div>
        <UploadWidget label="Add to gallery" accept="image/*,video/*,image/gif" onUploaded={addMedia} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={busy} style={{ alignSelf: "flex-start", marginTop: 6 }}>
        {busy ? "saving…" : v.status === "DRAFT" ? "Save as draft" : submitLabel}
      </button>
    </form>
  );
}
