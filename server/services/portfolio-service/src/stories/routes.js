// stories/routes.js
// story routes

import express from "express";
import * as dao from "./dao.js";
import { requireAuth } from "../shared/middleware.js";

const router = express.Router();

// post a story
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const me = req.session.currentUser;
    const s = await dao.createStory({
      owner: me._id,
      ownerUsername: me.username,
      ownerName: me.displayName || me.username,
      ownerAvatar: me.avatarUrl || "",
      imageUrl: req.body.imageUrl,
      imageKey: req.body.imageKey,
      caption: req.body.caption,
      poll: req.body.poll,
    });
    if (!s) return res.status(400).json({ message: "need an image" });
    res.status(201).json(s);
  } catch (e) {
    next(e);
  }
});

// live stories
router.post("/active", async (req, res, next) => {
  try {
    const owners = Array.isArray(req.body.owners) ? req.body.owners : [];
    res.json(await dao.activeFor(owners));
  } catch (e) {
    next(e);
  }
});

// answer a sticker
router.post("/:id/vote", requireAuth, async (req, res, next) => {
  try {
    const out = await dao.vote(req.params.id, req.session.currentUser._id, req.body.option, req.body.text);
    if (!out) return res.status(400).json({ message: "cannot vote on that" });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

export default router;
