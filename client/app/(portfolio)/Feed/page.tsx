"use client";

// Feed/page.tsx
// home feed

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import PawLoader from "../../components/PawLoader";
import EmptyState from "../../components/EmptyState";
import FeedPost from "../../components/FeedPost";
import Stories from "../../components/Stories";
import { followingIds } from "../Account/client";
import { feed, recommend } from "../Projects/client";
import type { Project } from "../../lib/types";

type Tab = "following" | "foryou";

function Inner() {
  const [tab, setTab] = useState<Tab>("following");
  const [ids, setIds] = useState<string[] | null>(null);
  const [items, setItems] = useState<Project[] | null>(null);

  // grab who i follow once
  useEffect(() => {
    followingIds()
      .then(setIds)
      .catch(() => setIds([]));
  }, []);

  const load = useCallback(
    async (which: Tab, follow: string[]) => {
      setItems(null);
      try {
        if (which === "following") {
          setItems(follow.length ? await feed(follow) : []);
        } else {
          setItems(await recommend(follow));
        }
      } catch {
        setItems([]);
      }
    },
    []
  );

  useEffect(() => {
    if (ids !== null) load(tab, ids);
  }, [tab, ids, load]);

  return (
    <div className="wrap section page-enter">
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ marginBottom: 14 }}>
          <span className="eyebrow">🏠 home</span>
          <h1 className="section-title" style={{ marginBottom: 12 }}>Your feed</h1>
          {ids !== null && <Stories ids={ids} projects={items} />}
          <div className="row" style={{ gap: 8 }}>
            <button className={"chip" + (tab === "following" ? " active" : "")} onClick={() => setTab("following")}>
              Following
            </button>
            <button className={"chip" + (tab === "foryou" ? " active" : "")} onClick={() => setTab("foryou")}>
              ✨ For You
            </button>
          </div>
        </div>

        {items === null ? (
          <PawLoader />
        ) : items.length === 0 ? (
          tab === "following" ? (
            <EmptyState
              emoji="🐾"
              title="Your feed is quiet"
              hint="Follow a few creators, or peek at For You to find work you'll love."
              ctaHref="/Discover"
              ctaLabel="Find creators"
            />
          ) : (
            <EmptyState emoji="🌱" title="Nothing to recommend yet" hint="Like and save a few things and For You will fill up fast." ctaHref="/Discover" ctaLabel="Explore" />
          )
        ) : (
          <>
            {items.map((p) => (
              <FeedPost key={p._id} project={p} />
            ))}
            <div style={{ textAlign: "center", marginTop: 6 }}>
              <Link href="/Discover" className="btn btn-cream btn-sm">
                Discover more
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  );
}
