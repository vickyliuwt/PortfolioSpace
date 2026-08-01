"use client";

// page.tsx (home)
// hero + value props + featured work

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiUploadCloud, FiSearch, FiHeart } from "react-icons/fi";
import ProjectCard from "./components/ProjectCard";
import PawLoader from "./components/PawLoader";
import { featured, recommend } from "./(portfolio)/Projects/client";
import { followingIds } from "./(portfolio)/Account/client";
import { useAppSelector } from "./store/hooks";
import type { Project } from "./lib/types";

const VALUE_PROPS = [
  { icon: <FiUploadCloud />, tile: "c-pink", t: "Upload anything", d: "Reels, illustrations, repos or docs — stored safe and streamed with presigned links.", href: "/Projects/New" },
  { icon: <FiSearch />, tile: "c-sky", t: "Get discovered", d: "Tag, categorize and search — art and engineering work alike.", href: "/Discover" },
  { icon: <FiHeart />, tile: "c-mint", t: "Public or private", d: "Keep drafts private, then publish when a piece or project is ready.", href: "/Projects" },
];

export default function HomePage() {
  const user = useAppSelector((s) => s.account.currentUser);
  const [items, setItems] = useState<Project[] | null>(null);
  const [recs, setRecs] = useState<Project[] | null>(null);

  useEffect(() => {
    featured()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (!user) {
      setRecs(null);
      return;
    }
    (async () => {
      try {
        const ids = await followingIds();
        setRecs(await recommend(ids));
      } catch {
        setRecs([]);
      }
    })();
  }, [user]);

  return (
    <div className="page-enter">
      {/* hero */}
      <section className="wrap section">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 34, alignItems: "center" }}>
          <motion.div className="stagger" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="otw">
              <span className="dotlive" aria-hidden="true" /> your work, your space
            </div>
            <span className="eyebrow">🐾 a cozy home for creative work</span>
            <h1 className="shimmer-name" style={{ fontSize: "clamp(2.6rem, 8vw, 4.4rem)", margin: "4px 0 2px" }}>
              PortfolioSpace
            </h1>
            <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(1.2rem, 4vw, 1.8rem)", color: "var(--pink-ink)" }}>
              Show your work. Find your people.
            </div>
            <p style={{ fontSize: "1.08rem", margin: "16px 0 6px", maxWidth: 460 }}>
              A little home for animators, illustrators, designers and engineers to save their
              projects, stream their reels, follow makers they love, and get discovered.
            </p>
            <p className="accent" style={{ marginBottom: 22 }}>show it · store it · share it 💗</p>

            <div className="row">
              <Link href={user ? "/Projects/New" : "/Account/Signup"} className="btn btn-pink">
                {user ? "Add a project" : "Join"} <FiArrowRight />
              </Link>
              <Link href="/Discover" className="btn btn-cream">
                Browse work 🎨
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <div className="glow-wrap card" style={{ padding: 26, textAlign: "center", maxWidth: 340 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mascot/dog-love.webp"
                alt="PortfolioSpace mascot"
                style={{ width: "82%", maxWidth: 250, filter: "drop-shadow(0 12px 20px rgba(150,90,105,.25))" }}
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
              <div className="accent" style={{ fontSize: "1.7rem" }}>welcome home!</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* value props */}
      <section className="wrap section-tight">
        <div className="trio">
          {VALUE_PROPS.map((c, i) => (
            <Link key={c.t} href={c.href} style={{ textDecoration: "none", color: "inherit" }}>
              <motion.div
                className="card card-hover"
                style={{ height: "100%", cursor: "pointer" }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <span className={"pill " + c.tile} style={{ fontSize: "1.4rem", width: 48, height: 48, padding: 0, justifyContent: "center", display: "inline-flex" }}>
                  {c.icon}
                </span>
                <h3 style={{ marginTop: 12 }}>{c.t}</h3>
                <p className="muted" style={{ margin: 0 }}>{c.d}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      <div className="paw-divider" aria-hidden="true">
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
      </div>

      {/* for you (personalized) */}
      {user && recs && recs.length > 0 && (
        <section className="wrap section" style={{ paddingBottom: 0 }}>
          <div className="spread" style={{ marginBottom: 18, alignItems: "flex-end" }}>
            <div>
              <span className="eyebrow">🎯 for you</span>
              <h2 className="section-title" style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)" }}>Picked for you</h2>
            </div>
            <Link href="/Discover" className="btn btn-cream btn-sm">
              Explore <FiArrowRight />
            </Link>
          </div>
          <div className="grid">
            {recs.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* featured */}
      <section className="wrap section">
        <div className="spread" style={{ marginBottom: 18, alignItems: "flex-end" }}>
          <div>
            <span className="eyebrow">✨ fresh picks</span>
            <h2 className="section-title" style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)" }}>
              From the community
            </h2>
          </div>
          <Link href="/Discover" className="btn btn-cream btn-sm">
            See all <FiArrowRight />
          </Link>
        </div>

        {items === null ? (
          <PawLoader label="fetching pretty things…" />
        ) : items.length === 0 ? (
          <div className="card center" style={{ padding: "40px 24px" }}>
            <div style={{ fontSize: 46 }}>🎨</div>
            <h3 style={{ marginTop: 8 }}>No work yet</h3>
            <p className="muted">Be the first to post something lovely.</p>
            <Link href={user ? "/Projects/New" : "/Account/Signup"} className="btn btn-pink" style={{ marginTop: 6 }}>
              {user ? "Add a project" : "Join"}
            </Link>
          </div>
        ) : (
          <div className="grid">
            {items.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
