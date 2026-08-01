"use client";

// ContribGraph.tsx
// heatmap

export default function ContribGraph({ dates }: { dates: string[] }) {
  const counts = new Map<string, number>();
  for (const d of dates) {
    if (!d) continue;
    const key = new Date(d).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const weeks = 53;
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (weeks * 7 - 1) - end.getUTCDay());

  const cols: { key: string; count: number }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { key: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setUTCDate(start.getUTCDate() + w * 7 + d);
      const key = cur.toISOString().slice(0, 10);
      col.push({ key, count: counts.get(key) || 0 });
    }
    cols.push(col);
  }

  const color = (c: number) =>
    c === 0 ? "var(--cream-2)" : c === 1 ? "#f6ccd4" : c <= 3 ? "#ec88a3" : c <= 5 ? "#d96a86" : "#b34a6b";

  const total = dates.filter(Boolean).length;

  return (
    <div>
      <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>
        {cols.map((col, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {col.map((cell) => (
              <span
                key={cell.key}
                title={`${cell.count} on ${cell.key}`}
                style={{ width: 11, height: 11, borderRadius: 3, background: color(cell.count), flexShrink: 0 }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="spread" style={{ marginTop: 8, alignItems: "center" }}>
        <span className="muted" style={{ fontSize: "0.8rem" }}>{total} posts in the last year</span>
        <span className="row" style={{ gap: 4, fontSize: "0.72rem", color: "var(--cocoa-2)" }}>
          less
          {[0, 1, 2, 4, 6].map((c) => (
            <span key={c} style={{ width: 11, height: 11, borderRadius: 3, background: color(c) }} />
          ))}
          more
        </span>
      </div>
    </div>
  );
}
