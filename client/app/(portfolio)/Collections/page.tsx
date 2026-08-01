"use client";

// Collections/page.tsx
// my boards

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiFolder, FiTrash2 } from "react-icons/fi";
import ProtectedRoute from "../../components/ProtectedRoute";
import PawLoader from "../../components/PawLoader";
import EmptyState from "../../components/EmptyState";
import { myCollections, createCollection, deleteCollection } from "../Projects/client";
import type { Collection } from "../../lib/types";

function Inner() {
  const router = useRouter();
  const [items, setItems] = useState<Collection[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [busy, setBusy] = useState(false);

  const load = () => myCollections().then(setItems).catch(() => setItems([]));
  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await createCollection({ title: title.trim(), visibility });
      setTitle("");
      setVisibility("PUBLIC");
      setCreating(false);
      load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, t: string) => {
    if (!confirm(`Delete collection "${t}"?`)) return;
    await deleteCollection(id);
    load();
  };

  return (
    <div className="wrap section page-enter">
      <div className="spread" style={{ marginBottom: 18, alignItems: "flex-end" }}>
        <div>
          <span className="eyebrow">🗂️ my boards</span>
          <h1 className="section-title">Collections</h1>
          <p className="section-sub">Group your work into sets — case studies, series, playlists.</p>
        </div>
        <button className="btn btn-pink" onClick={() => setCreating((v) => !v)}>
          <FiPlus /> New collection
        </button>
      </div>

      {creating && (
        <form onSubmit={create} className="card" style={{ marginBottom: 18 }}>
          <div className="row" style={{ gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Best of 2026" autoFocus />
            </div>
            <div className="field" style={{ minWidth: 150 }}>
              <label>Visibility</label>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "…" : "Create"}
            </button>
          </div>
        </form>
      )}

      {items === null ? (
        <PawLoader />
      ) : items.length === 0 ? (
        <EmptyState emoji="🗂️" title="No collections yet" hint="Create one, then add projects to it from any project page." />
      ) : (
        <div className="grid">
          {items.map((c) => (
            <div
              key={c._id}
              className="card card-hover"
              style={{ display: "flex", flexDirection: "column", gap: 8, cursor: "pointer" }}
              onClick={() => router.push(`/Collections/${c._id}`)}
            >
              <div className="spread">
                <span className="pill c-sky">
                  <FiFolder style={{ verticalAlign: "-2px" }} /> {c.projects.length} items
                </span>
                {c.visibility === "PRIVATE" && (
                  <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                    🔒 private
                  </span>
                )}
              </div>
              <h3 style={{ margin: "4px 0" }}>{c.title}</h3>
              {c.description && (
                <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                  {c.description}
                </p>
              )}
              <div className="spread" style={{ marginTop: "auto", paddingTop: 8 }}>
                <span className="btn btn-cream btn-sm">Open</span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(c._id, c.title);
                  }}
                  aria-label="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  );
}
