// moderation routes

import express from "express";
import * as dao from "./dao.js";
import { requireAuth } from "./shared/middleware.js";

const router = express.Router();

// admin gate
function requireAdmin(req, res, next) {
  if (req.session?.currentUser?.role !== "ADMIN") {
    return res.status(403).json({ message: "admins only" });
  }
  next();
}

// new report
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const me = req.session.currentUser;
    const r = await dao.createReport({
      reporter: me._id,
      reporterName: me.displayName || me.username,
      targetType: req.body.targetType,
      targetId: req.body.targetId,
      reason: req.body.reason,
    });
    if (!r) return res.status(400).json({ message: "bad report" });
    res.status(201).json({ message: "thanks, we will take a look", _id: r._id });
  } catch (e) {
    next(e);
  }
});

// open count
router.get("/count", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    res.json({ open: await dao.countOpen() });
  } catch (e) {
    next(e);
  }
});

// queue
router.get("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    res.json(await dao.listReports(req.query.status || "OPEN"));
  } catch (e) {
    next(e);
  }
});

// set status
router.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const updated = await dao.setStatus(req.params.id, req.body.status);
    if (!updated) return res.status(400).json({ message: "bad status" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// remove target
router.post("/:id/remove-target", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const ok = await dao.removeTarget(req.body.targetType, req.body.targetId);
    if (!ok) return res.status(400).json({ message: "bad target" });
    res.json({ message: "removed" });
  } catch (e) {
    next(e);
  }
});

export default router;
