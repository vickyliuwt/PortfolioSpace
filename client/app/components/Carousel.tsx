"use client";

// Carousel.tsx
// gallery swipe

import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { MediaItem } from "../lib/types";

export default function Carousel({ items }: { items: MediaItem[] }) {
  const [i, setI] = useState(0);
  if (!items || items.length === 0) return null;

  const n = items.length;
  const cur = items[i];
  const go = (d: number) => setI((p) => (p + d + n) % n);

  const arrow = {
    position: "absolute" as const,
    top: "50%",
    transform: "translateY(-50%)",
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.92)",
    color: "var(--cocoa)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    zIndex: 2,
  };

  return (
    <div className="card" style={{ padding: 8 }}>
      <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "var(--cream-2)" }}>
        {cur.type === "video" ? (
          <video src={cur.url} controls style={{ width: "100%", display: "block", maxHeight: 560, objectFit: "contain", background: "#000" }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cur.url} alt={cur.caption || ""} style={{ width: "100%", display: "block", maxHeight: 560, objectFit: "contain" }} />
        )}

        {n > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous" style={{ ...arrow, left: 8 }}>
              <FiChevronLeft />
            </button>
            <button onClick={() => go(1)} aria-label="Next" style={{ ...arrow, right: 8 }}>
              <FiChevronRight />
            </button>
            <span style={{ position: "absolute", top: 10, right: 12, background: "rgba(0,0,0,0.5)", color: "#fff", borderRadius: 999, padding: "2px 10px", fontSize: "0.8rem", fontWeight: 700 }}>
              {i + 1} / {n}
            </span>
          </>
        )}
      </div>

      {cur.caption && <p className="muted" style={{ margin: "8px 4px 2px", fontSize: "0.88rem" }}>{cur.caption}</p>}

      {n > 1 && (
        <div className="row" style={{ gap: 6, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Go to ${idx + 1}`}
              style={{ width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0, background: idx === i ? "var(--rose)" : "var(--line)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
