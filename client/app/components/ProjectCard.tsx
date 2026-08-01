"use client";

// ProjectCard.tsx
// one project tile in a grid

import type { MouseEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiHeart, FiEye, FiGithub, FiGlobe, FiUserPlus, FiUserCheck } from "react-icons/fi";
import type { Project } from "../lib/types";
import { kindMeta } from "../lib/types";
import { truncate, catTile } from "../lib/format";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { addFollow, removeFollow } from "../store/followReducer";
import { toggleFollow } from "../(portfolio)/Account/client";
import { toggleLike } from "../(portfolio)/Projects/client";


export default function ProjectCard({ project }: { project: Project }) {
  const cover = project.coverUrl || "/covers/cover-default.svg";
  const tile = catTile(project.category, project.kind);

  const me = useAppSelector((s) => s.account.currentUser);
  const followIds = useAppSelector((s) => s.follow.ids);
  const dispatch = useAppDispatch();
  const isOwn = !!me && me._id === project.owner;
  const following = followIds.includes(project.owner);

  // stop click
  const onFollow = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await toggleFollow(project.owner);
      dispatch(res.following ? addFollow(project.owner) : removeFollow(project.owner));
    } catch {
      // ignore
    }
  };

  // card like
  const [liked, setLiked] = useState(!!(me && project.likedBy?.includes(me._id)));
  const [likes, setLikes] = useState(project.likes);
  const onLike = async (e: MouseEvent) => {
    if (!me) return; // let the card open; sign in there to like
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await toggleLike(project._id);
      setLiked(res.liked);
      setLikes(res.likes);
    } catch {
      // ignore
    }
  };

  return (
    <motion.div whileHover={{ y: -6, rotate: -1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} style={{ height: "100%" }}>
      <Link href={`/Projects/${project._id}`} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", background: "var(--cream-2)", lineHeight: 0 }}>
            {project.featured && <span className="featured-badge">★ Featured</span>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={project.title}
              loading="lazy"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <span className={"pill " + tile} style={{ position: "absolute", bottom: 10, left: 10 }}>
              {kindMeta(project.kind).emoji} {project.category}
            </span>
            {project.visibility === "PRIVATE" && (
              <span className="pill" style={{ position: "absolute", top: 10, right: 10, background: "#efe3dc", color: "#7c6154" }}>
                🔒 private
              </span>
            )}
          </div>

          <div style={{ padding: 15, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <h3 style={{ fontSize: "1.06rem", margin: 0 }}>{project.title}</h3>
            {project.summary && (
              <p className="muted" style={{ margin: 0, fontSize: "0.88rem", flex: 1, lineHeight: 1.5 }}>
                {truncate(project.summary, 84)}
              </p>
            )}
            <div className="spread" style={{ marginTop: 4 }}>
              <span className="row" style={{ gap: 6, fontSize: "0.82rem", fontWeight: 700, color: "var(--rose)" }}>
                @{project.ownerUsername}
                {project.repoUrl && <FiGithub aria-label="has code" style={{ color: "var(--cocoa-2)" }} />}
                {project.demoUrl && <FiGlobe aria-label="live demo" style={{ color: "var(--cocoa-2)" }} />}
              </span>
              <span className="row" style={{ gap: 12, fontSize: "0.82rem", color: "var(--cocoa-2)" }}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={onLike}
                  className="row"
                  style={{ gap: 4, cursor: me ? "pointer" : "inherit", color: liked ? "var(--rose)" : "inherit", fontWeight: liked ? 800 : "inherit" }}
                  aria-label={liked ? "Unlike" : "Like"}
                >
                  <FiHeart style={{ fill: liked ? "var(--rose)" : "none" }} /> {likes}
                </span>
                <span className="row" style={{ gap: 4 }}>
                  <FiEye /> {project.views}
                </span>
              </span>
            </div>
            {me && !isOwn && (
              <span
                role="button"
                tabIndex={0}
                onClick={onFollow}
                className={"btn btn-sm " + (following ? "btn-cream" : "btn-pink")}
                style={{ alignSelf: "flex-start", marginTop: 2 }}
              >
                {following ? (
                  <>
                    <FiUserCheck /> Following
                  </>
                ) : (
                  <>
                    <FiUserPlus /> Follow
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
