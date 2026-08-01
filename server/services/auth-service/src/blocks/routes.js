// blocks/routes.js
import express from "express";
import * as dao from "./dao.js";
import * as users from "../users/dao.js";
import { requireAuth } from "../shared/middleware.js";

const router = express.Router();

// block or unblock
router.post("/:userId", requireAuth, async (req, res, next) => {
  try {
    const out = await dao.toggle(req.session.currentUser._id, req.params.userId);
    if (!out) return res.status(400).json({ message: "cannot block that" });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

// people i blocked
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const rows = await dao.listFor(req.session.currentUser._id);
    const out = [];
    for (const r of rows) {
      const u = await users.findById(r.blocked);
      if (u) out.push({ _id: u._id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl });
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
});

// is this person blocked
router.get("/check/:userId", requireAuth, async (req, res, next) => {
  try {
    res.json({ blocked: await dao.isBlocked(req.session.currentUser._id, req.params.userId) });
  } catch (e) {
    next(e);
  }
});

export default router;
