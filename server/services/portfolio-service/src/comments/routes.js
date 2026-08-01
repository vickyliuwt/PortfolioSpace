// comments/routes.js
// mounted at /comments (gateway: /api/comments)

import express from "express";
import * as dao from "./dao.js";
import projectModel from "../projects/model.js";
import { requireAuth } from "../shared/middleware.js";
import { blockedBetween } from "../shared/blocks.js";

const router = express.Router();

// list for a project
router.get("/:projectId", async (req, res, next) => {
  try {
    res.json(await dao.listForProject(req.params.projectId));
  } catch (e) {
    next(e);
  }
});

// add one
router.post("/:projectId", requireAuth, async (req, res, next) => {
  try {
    const text = (req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "say something" });

    // someone she blocked should not be able to write on her work
    const proj = await projectModel.findById(req.params.projectId).select("owner");
    if (!proj) return res.status(404).json({ message: "project not found" });
    if (await blockedBetween(req.session.currentUser._id, proj.owner)) {
      return res.status(403).json({ message: "cannot comment on this" });
    }

    const c = await dao.addComment(req.params.projectId, req.session.currentUser, text, req.body.parent || "");
    res.status(201).json(c);
  } catch (e) {
    next(e);
  }
});

// comment like
router.post("/item/:commentId/like", requireAuth, async (req, res, next) => {
  try {
    const result = await dao.toggleLike(req.params.commentId, req.session.currentUser._id);
    if (!result) return res.status(404).json({ message: "comment not found" });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// react with an emoji (toggle)
router.post("/item/:commentId/react", requireAuth, async (req, res, next) => {
  try {
    const reactions = await dao.reactComment(req.params.commentId, req.body.emoji, req.session.currentUser._id);
    if (reactions === null) return res.status(400).json({ message: "could not react" });
    res.json({ reactions });
  } catch (e) {
    next(e);
  }
});

// delete (author only)
router.delete("/item/:commentId", requireAuth, async (req, res, next) => {
  try {
    const c = await dao.findById(req.params.commentId);
    if (!c) return res.status(404).json({ message: "comment not found" });
    if (c.author !== req.session.currentUser._id) return res.status(403).json({ message: "not yours" });
    await dao.remove(req.params.commentId);
    res.json({ message: "deleted", _id: req.params.commentId });
  } catch (e) {
    next(e);
  }
});

export default router;
