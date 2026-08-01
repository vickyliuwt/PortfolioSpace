// profileviews/routes.js
import express from "express";
import * as dao from "./dao.js";
import { requireAuth } from "../shared/middleware.js";

const router = express.Router();

// my visitors
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const me = req.session.currentUser._id;
    const [list, count] = await Promise.all([dao.recent(me, 20), dao.total(me)]);
    res.json({ total: count, viewers: list });
  } catch (e) {
    next(e);
  }
});

// count only
router.get("/count", requireAuth, async (req, res, next) => {
  try {
    res.json({ total: await dao.total(req.session.currentUser._id) });
  } catch (e) {
    next(e);
  }
});

export default router;
