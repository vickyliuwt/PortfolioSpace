// notifications/routes.js
// mounted at /notifications (client calls /api/auth/notifications)

import express from "express";
import * as dao from "./dao.js";
import { requireAuth } from "../shared/middleware.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    res.json(await dao.listFor(req.session.currentUser._id));
  } catch (e) {
    next(e);
  }
});

router.get("/unread-count", requireAuth, async (req, res, next) => {
  try {
    res.json({ count: await dao.unreadCount(req.session.currentUser._id) });
  } catch (e) {
    next(e);
  }
});

router.post("/read-all", requireAuth, async (req, res, next) => {
  try {
    await dao.markAll(req.session.currentUser._id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/read/:id", requireAuth, async (req, res, next) => {
  try {
    await dao.markOne(req.session.currentUser._id, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
