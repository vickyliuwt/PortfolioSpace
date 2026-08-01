"use client";

// PawLoader.tsx
// bouncy paw while loading

export default function PawLoader({ label = "loading…" }: { label?: string }) {
  return (
    <div className="spinner-paw">
      <div className="paw" aria-hidden="true">🐾</div>
      <div className="muted" style={{ fontWeight: 700, fontFamily: "var(--display)" }}>{label}</div>
    </div>
  );
}
