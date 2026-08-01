// collections/routes.js
// mounted at /collections (client calls /api/projects/collections/*)

import express from "express";
import * as dao from "./dao.js";
import { requireAuth } from "../shared/middleware.js";

const router = express.Router();

// my collections
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    res.json(await dao.mine(req.session.currentUser._id));
  } catch (e) {
    next(e);
  }
});

// someone's public collections
router.get("/by/:owner", async (req, res, next) => {
  try {
    res.json(await dao.publicByOwner(req.params.owner));
  } catch (e) {
    next(e);
  }
});

// board
router.get("/:id", async (req, res, next) => {
  try {
    const me = req.session?.currentUser;
    const data = await dao.withProjects(req.params.id, me?._id || "");
    if (!data) return res.status(404).json({ message: "collection not found" });
    if (data.collection.visibility === "PRIVATE" && (!me || me._id !== data.collection.owner)) {
      return res.status(404).json({ message: "collection not found" });
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// create
router.post("/", requireAuth, async (req, res, next) => {
  try {
    if (!req.body.title || !req.body.title.trim()) return res.status(400).json({ message: "give it a title" });
    const col = await dao.create(req.session.currentUser._id, req.session.currentUser, req.body);
    res.status(201).json(col);
  } catch (e) {
    next(e);
  }
});

// helper: owner guard
async function ownerOnly(req, res) {
  const col = await dao.getById(req.params.id);
  if (!col) {
    res.status(404).json({ message: "collection not found" });
    return null;
  }
  if (col.owner !== req.session.currentUser._id) {
    res.status(403).json({ message: "not yours" });
    return null;
  }
  return col;
}

// update
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    if (!(await ownerOnly(req, res))) return;
    res.json(await dao.update(req.params.id, req.body));
  } catch (e) {
    next(e);
  }
});

// delete
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    if (!(await ownerOnly(req, res))) return;
    await dao.remove(req.params.id);
    res.json({ message: "deleted", _id: req.params.id });
  } catch (e) {
    next(e);
  }
});

// add a project
router.post("/:id/items/:projectId", requireAuth, async (req, res, next) => {
  try {
    if (!(await ownerOnly(req, res))) return;
    await dao.addProject(req.params.id, req.params.projectId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// remove a project
router.delete("/:id/items/:projectId", requireAuth, async (req, res, next) => {
  try {
    if (!(await ownerOnly(req, res))) return;
    await dao.removeProject(req.params.id, req.params.projectId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
