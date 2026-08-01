// saves/routes.js
// mounted at /saves (client calls /api/projects/saves/*)

import express from "express";
import * as dao from "./dao.js";
import { requireAuth } from "../shared/middleware.js";

const router = express.Router();

// my saved projects
router.get("/", requireAuth, async (req, res, next) => {
  try {
    res.json(await dao.projectsFor(req.session.currentUser._id));
  } catch (e) {
    next(e);
  }
});

// my saved ids (light, for button state)
router.get("/ids", requireAuth, async (req, res, next) => {
  try {
    res.json(await dao.idsFor(req.session.currentUser._id));
  } catch (e) {
    next(e);
  }
});

// is one project saved
router.get("/check/:projectId", requireAuth, async (req, res, next) => {
  try {
    res.json({ saved: await dao.isSaved(req.session.currentUser._id, req.params.projectId) });
  } catch (e) {
    next(e);
  }
});

// toggle save
router.post("/:projectId", requireAuth, async (req, res, next) => {
  try {
    res.json(await dao.toggle(req.session.currentUser, req.params.projectId));
  } catch (e) {
    next(e);
  }
});

export default router;
