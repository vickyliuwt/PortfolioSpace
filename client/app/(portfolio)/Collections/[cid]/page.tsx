"use client";

// Collections/[cid]/page.tsx
// board

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiX } from "react-icons/fi";
import PawLoader from "../../../components/PawLoader";
import EmptyState from "../../../components/EmptyState";
import ProjectCard from "../../../components/ProjectCard";
import { useAppSelector } from "../../../store/hooks";
import { getCollection, removeFromCollection } from "../../Projects/client";
import type { Collection, Project } from "../../../lib/types";

export default function CollectionDetailPage() {
  const params = useParams();
  const cid = String(params.cid);
  const me = useAppSelector((s) => s.account.currentUser);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getCollection(cid)
      .then((d) => {
        setCollection(d.collection);
        setProjects(Array.isArray(d.projects) ? d.projects : []);
      })
      .catch(() => setMissing(true));
  }, [cid]);

  const isOwner = !!me && !!collection && collection.owner === me._id;

  const remove = async (pid: string) => {
    await removeFromCollection(cid, pid);
    setProjects((old) => old.filter((p) => p._id !== pid));
  };

  if (missing)
    return (
      <div className="wrap section center page-enter">
        <div style={{ fontSize: 54 }}>🗂️</div>
        <h2 className="section-title" style={{ fontSize: "1.8rem" }}>Collection not found</h2>
        <Link href="/Discover" className="btn btn-pink" style={{ marginTop: 6 }}>Back to Discover</Link>
      </div>
    );

  if (!collection) return <PawLoader />;

  return (
    <div className="wrap section page-enter">
      <div style={{ marginBottom: 18 }}>
        <span className="eyebrow">🗂️ collection</span>
        <h1 className="section-title" style={{ margin: "6px 0 4px" }}>{collection.title}</h1>
        <Link href={`/Creators/${collection.ownerUsername}`} style={{ fontWeight: 700, color: "var(--rose)" }}>
          by {collection.ownerName} · @{collection.ownerUsername}
        </Link>
        {collection.description && <p className="muted" style={{ marginTop: 8 }}>{collection.description}</p>}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          emoji="🗂️"
          title="Nothing in here yet"
          hint={isOwner ? "Open any project and use Add to collection." : "This collection is empty."}
        />
      ) : (
        <div className="grid">
          {projects.map((p) => (
            <div key={p._id} style={{ position: "relative" }}>
              <ProjectCard project={p} />
              {isOwner && (
                <button
                  onClick={() => remove(p._id)}
                  aria-label="remove from collection"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 2,
                    background: "#fff",
                    border: "1.5px solid var(--line)",
                    borderRadius: "50%",
                    width: 30,
                    height: 30,
                    cursor: "pointer",
                  }}
                >
                  <FiX />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
