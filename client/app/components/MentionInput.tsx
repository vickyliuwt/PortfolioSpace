"use client";

// MentionInput.tsx
// mention box

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { listCreators } from "../(portfolio)/Account/client";
import type { Creator } from "../lib/types";
import { onAvatarError } from "../lib/img";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  onEnter?: () => void;
  style?: CSSProperties;
}

export default function MentionInput({ value, onChange, placeholder, maxLength, onEnter, style }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const tokenRef = useRef<{ start: number; query: string } | null>(null);
  const [matches, setMatches] = useState<Creator[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // find token
  const detect = (text: string, caret: number) => {
    const upto = text.slice(0, caret);
    const m = upto.match(/(^|\s)@([a-zA-Z0-9_]{0,20})$/);
    if (!m) return null;
    const query = m[2];
    return { start: caret - query.length - 1, query };
  };

  const handleChange = (text: string) => {
    onChange(text);
    const el = ref.current;
    const caret = el ? el.selectionStart ?? text.length : text.length;
    const tok = detect(text, caret);
    tokenRef.current = tok;
    if (tok) {
      setOpen(true);
      setActive(0);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const tok = tokenRef.current;
    if (!tok) return;
    const t = setTimeout(() => {
      listCreators(tok.query)
        .then((list) => setMatches(list.slice(0, 6)))
        .catch(() => setMatches([]));
    }, 180);
    return () => clearTimeout(t);
  }, [open, value]);

  const pick = (c: Creator) => {
    const tok = tokenRef.current;
    if (!tok) return;
    const before = value.slice(0, tok.start);
    const after = value.slice(tok.start + 1 + tok.query.length);
    const next = `${before}@${c.username} ${after}`;
    onChange(next);
    setOpen(false);
    setMatches([]);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) {
        const pos = (before + "@" + c.username + " ").length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (open && matches.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pick(matches[active]);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
      <input
        ref={ref}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{ width: "100%", ...style }}
      />
      {open && matches.length > 0 && (
        <div className="card" style={{ position: "absolute", bottom: "112%", left: 0, right: 0, zIndex: 30, padding: 6, maxHeight: 250, overflowY: "auto" }}>
          {matches.map((c, i) => (
            <button
              key={c._id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c);
              }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: i === active ? "var(--cream-2)" : "none", border: "none", cursor: "pointer", padding: "7px 8px", borderRadius: 10, textAlign: "left" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="avatar" src={c.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError} alt="" width={30} height={30} style={{ borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 800, display: "block", fontSize: "0.88rem" }}>{c.displayName}</span>
                <span className="muted" style={{ fontSize: "0.75rem" }}>@{c.username}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
