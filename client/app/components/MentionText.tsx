"use client";

// MentionText.tsx
// mention links

import Link from "next/link";

export default function MentionText({ text }: { text: string }) {
  return (
    <>
      {/* the lookbehind stops the @site inside hi@site.com becoming a link */}
      {text.split(/((?<![A-Za-z0-9_.@])@[a-zA-Z0-9_]+)/g).map((part, i) =>
        /^@[a-zA-Z0-9_]+$/.test(part) ? (
          <Link key={i} href={`/Creators/${part.slice(1)}`} style={{ color: "var(--sky-ink)", fontWeight: 700, textDecoration: "none" }}>
            {part}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
