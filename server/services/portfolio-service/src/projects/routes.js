// projects/routes.js
// project endpoints (mounted under /api/projects by the gateway)

import express from "express";
import * as dao from "./dao.js";
import { requireAuth } from "../shared/middleware.js";
import { cacheWrap, cacheBust } from "../shared/cache.js";

const router = express.Router();

// ---- discover (public) ----

// GET /discover?q=&category=&tag=&sort=
router.get("/discover", async (req, res, next) => {
  try {
    const params = {
      q: req.query.q,
      kind: req.query.kind,
      category: req.query.category,
      tag: req.query.tag,
      sort: req.query.sort,
      page: Number(req.query.page) || 0,
      limit: Number(req.query.limit) || 24,
      viewerId: req.session?.currentUser?._id || "",
    };
    // cache 30s
    const key = "discover:" + JSON.stringify(params);
    const list = await cacheWrap(key, 30, () => dao.discover(params));
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// featured hero
router.get("/featured", async (req, res, next) => {
  try {
    res.json(await cacheWrap("featured", 60, () => dao.findFeatured(5)));
  } catch (e) {
    next(e);
  }
});

// short-video "reels" feed
router.get("/reels", async (req, res, next) => {
  try {
    res.json(await cacheWrap("reels", 30, () => dao.reelsFeed(30)));
  } catch (e) {
    next(e);
  }
});

// tag chips
router.get("/tags", async (req, res, next) => {
  try {
    res.json(await dao.allTags());
  } catch (e) {
    next(e);
  }
});

// ---- my projects ----

// list mine (private included)
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const me = req.session.currentUser._id;
    res.json(await dao.workingSetOf(me));
  } catch (e) {
    next(e);
  }
});

// my stats
router.get("/mine/stats", requireAuth, async (req, res, next) => {
  try {
    res.json(await dao.ownerStats(req.session.currentUser._id));
  } catch (e) {
    next(e);
  }
});

// similar
router.get("/:id/similar", async (req, res, next) => {
  try {
    res.json(await dao.similarTo(req.params.id, 6));
  } catch (e) {
    next(e);
  }
});

// my daily views/likes trend
router.get("/mine/trend", requireAuth, async (req, res, next) => {
  try {
    const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
    res.json(await dao.trendFor(req.session.currentUser._id, days));
  } catch (e) {
    next(e);
  }
});

// public projects of a creator
router.get("/by/:owner", async (req, res, next) => {
  try {
    const viewer = req.session?.currentUser?._id;
    res.json(await dao.publicProjectsOf(req.params.owner, viewer));
  } catch (e) {
    next(e);
  }
});

// create
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const check = dao.validate(req.body);
    if (!check.ok) return res.status(400).json({ message: "check your info", errors: check.errors });

    const me = req.session.currentUser;

    // optional cap, set BASIC_PROJECT_LIMIT to turn it on
    const limit = Number(process.env.BASIC_PROJECT_LIMIT || 0);
    const isPro = String(me.plan || "FREE").toUpperCase() === "PRO";
    if (limit > 0 && !isPro) {
      const have = await dao.countByOwner(me._id);
      if (have >= limit) {
        return res.status(402).json({
          code: "PLAN_LIMIT",
          message: `this plan holds ${limit} projects. switch to Pro for more.`,
          limit,
        });
      }
    }

    const proj = await dao.createProject(me._id, me, req.body);
    void cacheBust();
    res.status(201).json(proj);
  } catch (e) {
    next(e);
  }
});

// ---- single project ----

// read one (bumps views, hides private from strangers)
router.get("/:id", async (req, res, next) => {
  try {
    const proj = await dao.findById(req.params.id);
    if (!proj) return res.status(404).json({ message: "project not found" });

    const me = req.session?.currentUser?._id;
    const onTeam = dao.canEdit(proj, me); // owner or credited
    if (!onTeam) {
      // hide drafts
      if (proj.status === "DRAFT") return res.status(404).json({ message: "project not found" });
      if (proj.visibility === "PRIVATE") return res.status(403).json({ message: "this project is private" });
      if (proj.visibility === "FRIENDS") {
        const friend = await dao.isFollower(me, proj.owner);
        if (!friend) return res.status(403).json({ message: "this project is for followers only" });
      }
    }

    if (!onTeam) {
      await dao.addView(proj._id);
      void dao.recordDaily(proj.owner, "views");
    }
    res.json(proj);
  } catch (e) {
    next(e);
  }
});

// update (owner only)
// past edits, mine only
router.get("/:id/versions", requireAuth, async (req, res, next) => {
  try {
    const proj = await dao.findById(req.params.id);
    if (!proj) return res.status(404).json({ message: "project not found" });
    if (!dao.canEdit(proj, req.session.currentUser._id)) return res.status(403).json({ message: "not yours" });
    res.json(await dao.versionsOf(req.params.id));
  } catch (e) {
    next(e);
  }
});

// roll one back
router.post("/:id/restore/:index", requireAuth, async (req, res, next) => {
  try {
    const proj = await dao.findById(req.params.id);
    if (!proj) return res.status(404).json({ message: "project not found" });
    if (!dao.canEdit(proj, req.session.currentUser._id)) return res.status(403).json({ message: "not yours" });
    const out = await dao.restoreVersion(req.params.id, req.params.index);
    if (!out) return res.status(400).json({ message: "no such version" });
    void cacheBust();
    res.json(out);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const me = req.session.currentUser;
    const proj = await dao.findById(req.params.id);
    if (!proj) return res.status(404).json({ message: "project not found" });
    if (!dao.canEdit(proj, me._id)) return res.status(403).json({ message: "not yours" });

    // owner keeps the list
    const body = { ...req.body };
    const isOwner = proj.owner === me._id;
    if (!isOwner) delete body.collaborators;

    const had = (proj.collaborators || []).map((c) => c.user);
    const updated = await dao.updateProject(req.params.id, body);

    // ping new people
    if (isOwner && body.collaborators !== undefined) {
      const added = (updated.collaborators || []).map((c) => c.user).filter((u) => !had.includes(u));
      dao.notifyCredits(updated, me, added);
    }

    void cacheBust();
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// delete (owner only)
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const proj = await dao.findById(req.params.id);
    if (!proj) return res.status(404).json({ message: "project not found" });
    if (proj.owner !== req.session.currentUser._id) return res.status(403).json({ message: "not yours" });

    await dao.deleteProject(req.params.id);
    void cacheBust();
    res.json({ message: "deleted", _id: req.params.id });
  } catch (e) {
    next(e);
  }
});

// feed = recent public work from people i follow (client passes their ids)
router.post("/feed", async (req, res, next) => {
  try {
    const owners = Array.isArray(req.body.owners) ? req.body.owners : [];
    res.json(await dao.feedFor(owners));
  } catch (e) {
    next(e);
  }
});

// "for you" recommendations
router.post("/recommend", requireAuth, async (req, res, next) => {
  try {
    const boost = Array.isArray(req.body.boostOwners) ? req.body.boostOwners : [];
    res.json(await dao.recommendFor(req.session.currentUser._id, boost));
  } catch (e) {
    next(e);
  }
});

// like / unlike
router.post("/:id/like", requireAuth, async (req, res, next) => {
  try {
    const result = await dao.toggleLike(req.params.id, req.session.currentUser);
    if (!result) return res.status(404).json({ message: "project not found" });
    void cacheBust();
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
