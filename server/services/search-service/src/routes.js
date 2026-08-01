// routes.js
// routes

import express from "express";
import * as es from "./es.js";
import { reindexAll, indexOneProject } from "./indexer.js";
import { requireAuth } from "./shared/middleware.js";

const router = express.Router();

// projects
router.get("/projects", async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const kind = req.query.kind;
    const category = req.query.category;
    const size = Math.min(50, Number(req.query.limit) || 24);

    const must = q
      ? [
          {
            multi_match: {
              query: q,
              fields: ["title^4", "tags^3", "summary^2", "tools^2", "ownerName^2", "description"],
              fuzziness: "AUTO",
            },
          },
        ]
      : [{ match_all: {} }];

    const filter = [];
    if (kind && kind !== "All") filter.push({ term: { kind } });
    if (category && category !== "All") filter.push({ term: { category } });

    const out = await es.search(es.PROJECT_INDEX, {
      size,
      query: { bool: { must, filter } },
      sort: q ? ["_score", { likes: "desc" }] : [{ likes: "desc" }],
      highlight: { fields: { title: {}, summary: {}, description: {} }, pre_tags: ["<em>"], post_tags: ["</em>"] },
    });
    res.json({ es: true, ...out });
  } catch (e) {
    // es down
    res.json({ es: false, reason: e.message, total: 0, hits: [] });
  }
});

// messages
router.get("/messages", requireAuth, async (req, res, next) => {
  try {
    const me = req.session.currentUser._id;
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ es: true, total: 0, hits: [] });

    const out = await es.search(es.MESSAGE_INDEX, {
      size: 30,
      query: {
        bool: {
          must: [{ match: { text: { query: q, fuzziness: "AUTO" } } }],
          filter: [{ bool: { should: [{ term: { from: me } }, { term: { to: me } }], minimum_should_match: 1 } }],
        },
      },
      sort: ["_score", { createdAt: "desc" }],
      highlight: { fields: { text: {} }, pre_tags: ["<em>"], post_tags: ["</em>"] },
    });
    res.json({ es: true, ...out });
  } catch (e) {
    res.json({ es: false, reason: e.message, total: 0, hits: [] });
  }
});

// suggest
router.get("/suggest", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ es: true, hits: [] });
    const out = await es.search(es.PROJECT_INDEX, {
      size: 8,
      _source: ["title", "ownerUsername", "coverUrl"],
      query: { multi_match: { query: q, type: "bool_prefix", fields: ["title", "title._2gram", "tags"] } },
    });
    res.json({ es: true, ...out });
  } catch (e) {
    res.json({ es: false, reason: e.message, hits: [] });
  }
});

// reindex
router.post("/reindex", requireAuth, async (req, res, next) => {
  try {
    if (req.session.currentUser.role !== "ADMIN") return res.status(403).json({ message: "admins only" });
    const counts = await reindexAll({ fresh: !!req.body?.fresh });
    res.json({ message: "reindexed", ...counts });
  } catch (e) {
    next(e);
  }
});

// one doc
router.post("/index/project/:id", requireAuth, async (req, res, next) => {
  try {
    const ok = await indexOneProject(req.params.id);
    res.json({ indexed: ok });
  } catch (e) {
    next(e);
  }
});

export default router;
