"use client";

// EmptyState.tsx
// friendly nudge when a list is empty

import Link from "next/link";

export default function EmptyState({
  emoji = "🎨",
  title,
  hint,
  ctaHref,
  ctaLabel,
}: {
  emoji?: string;
  title: string;
  hint?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="card center" style={{ padding: "48px 24px" }}>
      <div style={{ fontSize: 54 }}>{emoji}</div>
      <h3 style={{ marginTop: 10 }}>{title}</h3>
      {hint && <p className="muted">{hint}</p>}
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="btn btn-pink" style={{ marginTop: 8 }}>
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
