"use client";

// Saved/page.tsx
// projects i bookmarked

import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import PawLoader from "../../components/PawLoader";
import EmptyState from "../../components/EmptyState";
import ProjectCard from "../../components/ProjectCard";
import { listSaved } from "../Projects/client";
import type { Project } from "../../lib/types";

function Inner() {
  const [items, setItems] = useState<Project[] | null>(null);

  useEffect(() => {
    listSaved()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="wrap section page-enter">
      <div style={{ marginBottom: 18 }}>
        <span className="eyebrow">🔖 your shelf</span>
        <h1 className="section-title">Saved work</h1>
        <p className="section-sub">Pieces you bookmarked to revisit later.</p>
      </div>

      {items === null ? (
        <PawLoader />
      ) : items.length === 0 ? (
        <EmptyState
          emoji="🔖"
          title="Nothing saved yet"
          hint="Tap save on any project and it will wait for you here."
          ctaHref="/Discover"
          ctaLabel="Browse Discover"
        />
      ) : (
        <div className="grid">
          {items.map((p) => (
            <ProjectCard key={p._id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SavedPage() {
  return (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  );
}
