"use client";

// Decor.tsx
// soft floating paws in the background

const BITS = [
  { e: "🐾", top: "16%", left: "5%", delay: "0s", size: 26 },
  { e: "💗", top: "60%", left: "8%", delay: "3s", size: 22 },
  { e: "🐾", top: "30%", left: "92%", delay: "1.5s", size: 24 },
  { e: "🦴", top: "75%", left: "90%", delay: "4.5s", size: 22 },
  { e: "✨", top: "44%", left: "48%", delay: "2s", size: 18 },
];

export default function Decor() {
  return (
    <div aria-hidden="true">
      {BITS.map((b, i) => (
        <span
          key={i}
          className="floaty"
          style={{ top: b.top, left: b.left, fontSize: b.size, animationDelay: b.delay }}
        >
          {b.e}
        </span>
      ))}
    </div>
  );
}
