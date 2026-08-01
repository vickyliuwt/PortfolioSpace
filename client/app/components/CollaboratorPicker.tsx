"use client";

// CollaboratorPicker.tsx
// credit teammates

import { useEffect, useRef, useState } from "react";
import { FiX, FiSearch, FiUsers } from "react-icons/fi";
import { listCreators } from "../(portfolio)/Account/client";
import type { Creator, Collaborator } from "../lib/types";
import { onAvatarError } from "../lib/img";

interface Props {
  value: Collaborator[];
  onChange: (list: Collaborator[]) => void;
  meId?: string;
  max?: number;
}

export default function CollaboratorPicker({ value, onChange, meId, max = 10 }: Props) {
  const [q, setQ] = useState("");
  const [matches, setMatches] = useState<Creator[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const full = value.length >= max;

  // live search
  useEffect(() => {
    if (!q.trim()) {
      setMatches([]);
      return;
    }
    const t = setTimeout(() => {
      listCreators(q.trim().replace(/^@/, ""))
        .then((list) => setMatches(list.slice(0, 6)))
        .catch(() => setMatches([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  // click away
  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const add = (c: Creator) => {
    if (full) return;
    if (c._id === meId) return; // already the owner
    if (value.some((v) => v.user === c._id)) return; // no doubles
    onChange([...value, { user: c._id, username: c.username, name: c.displayName || c.username, avatar: c.avatarUrl, role: "" }]);
    setQ("");
    setMatches([]);
    setOpen(false);
  };

  const drop = (userId: string) => onChange(value.filter((v) => v.user !== userId));

  const setRole = (userId: string, role: string) =>
    onChange(value.map((v) => (v.user === userId ? { ...v, role } : v)));

  const already = (id: string) => value.some((v) => v.user === id) || id === meId;

  return (
    <div className="field">
      <label>
        <FiUsers style={{ verticalAlign: "-2px" }} /> Team credits (optional)
      </label>
      <p className="muted" style={{ fontSize: "0.78rem", margin: "0 0 8px" }}>
        Search a handle to credit whoever worked on this with you. They can edit the project, and it shows up on their profile too.
      </p>

      {/* picked people */}
      {value.length > 0 && (
        <div className="stack" style={{ gap: 8, marginBottom: 10 }}>
          {value.map((c) => (
            <div
              key={c.user}
              className="row"
              style={{ gap: 10, alignItems: "center", border: "1.5px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "8px 10px" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="avatar" src={c.avatar || "/mascot/avatar-default.svg"} onError={onAvatarError} alt="" width={34} height={34} />
              <span style={{ minWidth: 0, flex: "0 0 auto" }}>
                <span style={{ fontWeight: 800, display: "block", fontSize: "0.9rem" }}>{c.name}</span>
                <span className="muted" style={{ fontSize: "0.75rem" }}>@{c.username}</span>
              </span>
              <input
                value={c.role || ""}
                onChange={(e) => setRole(c.user, e.target.value)}
                placeholder="what they did, like Sound design"
                maxLength={60}
                style={{ flex: 1, minWidth: 120 }}
              />
              <button type="button" className="btn btn-cream btn-sm" onClick={() => drop(c.user)} aria-label={`remove ${c.username}`}>
                <FiX />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* search */}
      <div ref={boxRef} style={{ position: "relative" }}>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={full ? `That is ${max} people, the most a project holds` : "Search by name or @handle"}
          disabled={full}
        />
        {open && q.trim() !== "" && (
          <div className="card" style={{ position: "absolute", top: "108%", left: 0, right: 0, zIndex: 30, padding: 6, maxHeight: 260, overflowY: "auto" }}>
            {matches.length === 0 ? (
              <p className="muted" style={{ margin: 0, padding: "8px 10px", fontSize: "0.84rem" }}>
                <FiSearch style={{ verticalAlign: "-2px" }} /> Nobody with that handle yet.
              </p>
            ) : (
              matches.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  disabled={already(c._id)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(c);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: already(c._id) ? "default" : "pointer",
                    padding: "7px 8px",
                    borderRadius: 10,
                    textAlign: "left",
                    opacity: already(c._id) ? 0.45 : 1,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="avatar" src={c.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError} alt="" width={30} height={30} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 800, display: "block", fontSize: "0.88rem" }}>{c.displayName}</span>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      @{c.username}
                      {c._id === meId ? " - that is you" : already(c._id) ? " - added" : ""}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
