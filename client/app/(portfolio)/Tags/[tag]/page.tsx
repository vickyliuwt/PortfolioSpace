"use client";

// Tags/[tag]/page.tsx
// public work carrying one tag

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProjectCard from "../../../components/ProjectCard";
import PawLoader from "../../../components/PawLoader";
import EmptyState from "../../../components/EmptyState";
import { discover } from "../../Projects/client";
import type { Project } from "../../../lib/types";

export default function TagPage() {
  const params = useParams();
  const tag = decodeURIComponent(String(params.tag));
  const [items, setItems] = useState<Project[] | null>(null);

  useEffect(() => {
    discover({ tag })
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]));
  }, [tag]);

  return (
    <div className="wrap section page-enter">
      <div style={{ marginBottom: 18 }}>
        <span className="eyebrow">🏷️ tag</span>
        <h1 className="section-title">#{tag}</h1>
        <p className="section-sub">Public work tagged with “{tag}”.</p>
      </div>

      {items === null ? (
        <PawLoader />
      ) : items.length === 0 ? (
        <EmptyState emoji="🏷️" title="Nothing tagged yet" hint="Try another tag from a project page." ctaHref="/Discover" ctaLabel="Explore" />
      ) : (
        <>
          <p className="muted" style={{ marginBottom: 14, fontWeight: 700 }}>
            {items.length} {items.length === 1 ? "project" : "projects"}
          </p>
          <div className="grid">
            {items.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
