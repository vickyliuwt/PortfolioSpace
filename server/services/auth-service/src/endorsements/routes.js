// endorsements/routes.js
import express from "express";
import * as dao from "./dao.js";
import { requireAuth } from "../shared/middleware.js";

const router = express.Router();

// toggle
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const result = await dao.toggle(req.body.owner, req.body.skill, req.session.currentUser._id);
    if (!result) return res.status(400).json({ message: "cannot endorse" });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// counts
router.get("/:userId", async (req, res, next) => {
  try {
    res.json(await dao.countsFor(req.params.userId, req.session?.currentUser?._id));
  } catch (e) {
    next(e);
  }
});

export default router;
