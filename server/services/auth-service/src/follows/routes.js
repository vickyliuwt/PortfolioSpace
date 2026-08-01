// follows/routes.js
// mounted at /follow (client calls /api/auth/follow/*)

import express from "express";
import * as dao from "./dao.js";
import { notify } from "../notifications/dao.js";
import { requireAuth } from "../shared/middleware.js";
import * as blocks from "../blocks/dao.js";

const router = express.Router();

// top creators by follower count (leaderboard / directory)
router.get("/top", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 60, 100);
    res.json(await dao.creatorsRanked(limit));
  } catch (e) {
    next(e);
  }
});

// people i follow (cards)
router.get("/following", requireAuth, async (req, res, next) => {
  try {
    res.json(await dao.followingUsers(req.session.currentUser._id));
  } catch (e) {
    next(e);
  }
});

// ids i follow (for the feed)
router.get("/following-ids", requireAuth, async (req, res, next) => {
  try {
    res.json(await dao.followingIds(req.session.currentUser._id));
  } catch (e) {
    next(e);
  }
});

// people following me
router.get("/followers", requireAuth, async (req, res, next) => {
  try {
    res.json(await dao.followerUsers(req.session.currentUser._id));
  } catch (e) {
    next(e);
  }
});

// counts for any profile
router.get("/counts/:userId", async (req, res, next) => {
  try {
    res.json(await dao.counts(req.params.userId));
  } catch (e) {
    next(e);
  }
});

// am i following this user
router.get("/check/:userId", requireAuth, async (req, res, next) => {
  try {
    res.json({ following: await dao.isFollowing(req.session.currentUser._id, req.params.userId) });
  } catch (e) {
    next(e);
  }
});

// follow / unfollow
router.post("/:userId", requireAuth, async (req, res, next) => {
  try {
    const me = req.session.currentUser;
    if (me._id === req.params.userId) return res.status(400).json({ message: "cannot follow yourself" });
    if (await blocks.isBlocked(me._id, req.params.userId)) return res.status(403).json({ message: "cannot follow this person" });
    const result = await dao.toggle(me._id, req.params.userId);
    if (result.following) {
      notify({
        user: req.params.userId,
        type: "follow",
        actor: me._id,
        actorName: me.displayName || me.username,
        actorUsername: me.username,
      });
    }
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
