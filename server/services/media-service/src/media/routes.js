// media/routes.js
// uploads + presigned links (mounted under /api/media by the gateway)

import express from "express";
import multer from "multer";
import mime from "mime-types";
import { v4 as uuid } from "uuid";
import * as storage from "./storage.js";
import { requireAuth } from "../shared/middleware.js";

const router = express.Router();

// keep files in memory, then push to storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50mb
});

// guess media type from mime
function kindOf(contentType = "") {
  if (contentType.startsWith("image/gif")) return "gif";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return "other";
}

// safe key: userId/uuid-name.ext
function makeKey(userId, filename) {
  const clean = (filename || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-40);
  return `${userId}/${uuid()}-${clean}`;
}

// upload a file (reliable server-side path)
router.post("/upload", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "no file" });

    const userId = req.session.currentUser._id;
    const contentType = req.file.mimetype || mime.lookup(req.file.originalname) || "application/octet-stream";
    const key = makeKey(userId, req.file.originalname);

    await storage.putObject(key, req.file.buffer, contentType);

    // public url for covers, presigned for private stream
    const url = storage.publicUrl(key);
    const viewUrl = await storage.presignView(key, 3600);

    res.status(201).json({
      key,
      url,
      viewUrl,
      type: kindOf(contentType),
      contentType,
      size: req.file.size,
    });
  } catch (e) {
    next(e);
  }
});

// presigned upload url (advanced: browser -> storage direct)
router.post("/presign-upload", requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.currentUser._id;
    const { filename, contentType } = req.body;
    const key = makeKey(userId, filename);
    const uploadUrl = await storage.presignUpload(key, contentType || "application/octet-stream", 900);
    res.json({ key, uploadUrl, publicUrl: storage.publicUrl(key) });
  } catch (e) {
    next(e);
  }
});

// fresh presigned view link (secure streaming of reels)
router.get("/view/*key", async (req, res, next) => {
  try {
    const key = req.params.key; // express 5 wildcard
    const url = await storage.presignView(Array.isArray(key) ? key.join("/") : key, 3600);
    res.json({ url });
  } catch (e) {
    next(e);
  }
});

// delete file
router.delete("/object", requireAuth, async (req, res, next) => {
  try {
    const key = req.body.key;
    if (!key || typeof key !== "string") return res.status(400).json({ message: "need key" });
    // "me/../someone-else/x" would slip past the prefix check below
    if (key.includes("..")) return res.status(400).json({ message: "bad key" });
    if (!key.startsWith(req.session.currentUser._id + "/") && req.session.currentUser.role !== "ADMIN") {
      return res.status(403).json({ message: "not yours" });
    }
    await storage.removeObject(key);
    res.json({ message: "deleted", key });
  } catch (e) {
    next(e);
  }
});

// local files
router.get("/files/*key", async (req, res, next) => {
  try {
    if (storage.driver !== "local") return res.status(404).json({ message: "not local mode" });
    const key = req.params.key;
    const buf = await storage.readLocal(Array.isArray(key) ? key.join("/") : key);
    res.setHeader("Content-Type", mime.lookup(String(key)) || "application/octet-stream");
    res.send(buf);
  } catch (e) {
    res.status(404).json({ message: "file not found" });
  }
});

export default router;
