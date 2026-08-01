// messages/routes.js
// mounted at /messages (client calls /api/auth/messages/*)

import express from "express";
import * as dao from "./dao.js";
import { notify } from "../notifications/dao.js";
import { requireAuth } from "../shared/middleware.js";
import * as blocks from "../blocks/dao.js";

const router = express.Router();

// my conversations
router.get("/threads", requireAuth, async (req, res, next) => {
  try {
    res.json(await dao.threads(req.session.currentUser._id));
  } catch (e) {
    next(e);
  }
});

// unread total (nav badge)
router.get("/unread-total", requireAuth, async (req, res, next) => {
  try {
    res.json({ count: await dao.unreadTotal(req.session.currentUser._id) });
  } catch (e) {
    next(e);
  }
});

// one person's card
router.get("/user/:userId", requireAuth, async (req, res, next) => {
  try {
    const card = await dao.userCard(req.params.userId);
    if (!card) return res.status(404).json({ message: "user not found" });
    res.json(card);
  } catch (e) {
    next(e);
  }
});

// unsend
router.delete("/item/:msgId", requireAuth, async (req, res, next) => {
  try {
    const m = await dao.findById(req.params.msgId);
    if (!m) return res.status(404).json({ message: "not found" });
    if (m.from !== req.session.currentUser._id) return res.status(403).json({ message: "not yours" });
    await dao.remove(req.params.msgId);
    res.json({ message: "deleted", _id: req.params.msgId });
  } catch (e) {
    next(e);
  }
});

// typing ping
router.post("/:userId/typing", requireAuth, async (req, res, next) => {
  try {
    dao.setTyping(req.session.currentUser._id, req.params.userId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// typing poll
router.get("/:userId/typing", requireAuth, async (req, res, next) => {
  try {
    res.json({ typing: dao.isTyping(req.params.userId, req.session.currentUser._id) });
  } catch (e) {
    next(e);
  }
});

// thread
router.get("/with/:userId", requireAuth, async (req, res, next) => {
  try {
    const me = req.session.currentUser._id;
    const msgs = await dao.conversation(me, req.params.userId);
    await dao.markRead(me, req.params.userId);
    res.json(msgs);
  } catch (e) {
    next(e);
  }
});

// send a message
router.post("/:userId", requireAuth, async (req, res, next) => {
  try {
    const me = req.session.currentUser;
    const text = (req.body.text || "").trim();
    const imageUrl = req.body.imageUrl || "";
    const imageKey = req.body.imageKey || "";
    const audioUrl = req.body.audioUrl || "";
    const audioKey = req.body.audioKey || "";
    const audioSecs = Number(req.body.audioSecs) || 0;
    const sticker = (req.body.sticker || "").slice(0, 16);
    const rawProject = req.body.project;
    const project = rawProject && rawProject.id ? { id: rawProject.id, title: rawProject.title || "", cover: rawProject.cover || "", owner: rawProject.owner || "" } : null;
    if (!text && !imageUrl && !audioUrl && !sticker && !project) return res.status(400).json({ message: "empty message" });
    if (me._id === req.params.userId) return res.status(400).json({ message: "cannot message yourself" });
    if (await blocks.isBlocked(me._id, req.params.userId)) return res.status(403).json({ message: "cannot message this person" });
    const msg = await dao.send(me._id, req.params.userId, { text, imageUrl, imageKey, audioUrl, audioKey, audioSecs, sticker, project });
    notify({
      user: req.params.userId,
      type: "message",
      actor: me._id,
      actorName: me.displayName || me.username,
      actorUsername: me.username,
      text: (text || (imageUrl ? "sent a photo" : audioUrl ? "sent a voice message" : sticker ? "sent a sticker" : project ? "shared a project" : "")).slice(0, 80),
    });
    res.status(201).json(msg);
  } catch (e) {
    next(e);
  }
});

export default router;
