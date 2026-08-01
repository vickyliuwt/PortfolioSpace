// recommendations/routes.js — mounted at /recommendations
import express from "express";
import * as dao from "./dao.js";
import { requireAuth } from "../shared/middleware.js";

const router = express.Router();

// write one
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const me = req.session.currentUser;
    const text = (req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "write something" });
    const rec = await dao.create({
      forUser: req.body.forUser,
      author: me._id,
      authorName: me.displayName || me.username,
      authorUsername: me.username,
      authorAvatar: me.avatarUrl || "",
      text,
    });
    if (!rec) return res.status(400).json({ message: "cannot recommend" });
    res.status(201).json(rec);
  } catch (e) {
    next(e);
  }
});

// list
router.get("/:userId", async (req, res, next) => {
  try {
    res.json(await dao.listFor(req.params.userId));
  } catch (e) {
    next(e);
  }
});

// delete mine
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const rec = await dao.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: "not found" });
    if (rec.author !== req.session.currentUser._id) return res.status(403).json({ message: "not yours" });
    await dao.remove(req.params.id);
    res.json({ message: "deleted", _id: req.params.id });
  } catch (e) {
    next(e);
  }
});

export default router;
