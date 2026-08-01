// users/routes.js
// auth routes

import express from "express";
import * as dao from "./dao.js";
import { requireAuth } from "../shared/middleware.js";
import { signToken } from "../shared/jwt.js";
import * as views from "../profileviews/dao.js";
import * as blocks from "../blocks/dao.js";
import followModel from "../follows/model.js";

const router = express.Router();

// make token
function tokenFor(u) {
  return signToken({
    sub: u._id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    plan: u.plan,
    avatarUrl: u.avatarUrl,
  });
}

// sign up
router.post("/signup", async (req, res, next) => {
  try {
    const check = dao.validate(req.body);
    if (!check.ok) return res.status(400).json({ message: "check your info", errors: check.errors });

    const user = await dao.createUser(req.body);
    const safe = user.toJSON();
    req.session.currentUser = safe;
    res.status(201).json({ ...safe, token: tokenFor(safe) });
  } catch (e) {
    next(e);
  }
});

// sign in
router.post("/signin", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "need username + password" });

    const user = await dao.verifyCredentials(username, password);
    if (!user) return res.status(401).json({ message: "wrong username or password" });

    const safe = user.toJSON();
    req.session.currentUser = safe;
    res.json({ ...safe, token: tokenFor(safe) });
  } catch (e) {
    next(e);
  }
});

// session to token
router.post("/token", async (req, res) => {
  if (!req.session?.currentUser) return res.status(401).json({ message: "please sign in first" });
  res.json({ token: tokenFor(req.session.currentUser), tokenType: "Bearer" });
});

// sign out
router.post("/signout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("ps.sid");
    res.json({ message: "bye" });
  });
});

// who am i
router.get("/profile", requireAuth, async (req, res, next) => {
  try {
    // fresh copy
    const user = await dao.findById(req.session.currentUser._id);
    if (!user) return res.status(404).json({ message: "gone" });
    req.session.currentUser = user.toJSON();
    res.json(user.toJSON());
  } catch (e) {
    next(e);
  }
});

// edit my profile
router.put("/profile", requireAuth, async (req, res, next) => {
  try {
    const updated = await dao.updateProfile(req.session.currentUser._id, req.body);
    req.session.currentUser = updated.toJSON();
    res.json(updated.toJSON());
  } catch (e) {
    next(e);
  }
});

// set my avatar (after upload)
router.put("/profile/avatar", requireAuth, async (req, res, next) => {
  try {
    const { key, url } = req.body;
    const updated = await dao.setAvatar(req.session.currentUser._id, key || "", url || "");
    req.session.currentUser = updated.toJSON();
    res.json(updated.toJSON());
  } catch (e) {
    next(e);
  }
});

// toggle pro / free (demo only, no real payment)
router.put("/profile/plan", requireAuth, async (req, res, next) => {
  try {
    const updated = await dao.setPlan(req.session.currentUser._id, req.body.plan);
    req.session.currentUser = updated.toJSON();
    res.json(updated.toJSON());
  } catch (e) {
    next(e);
  }
});

// change password
router.put("/profile/password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "need current + new password" });
    if (String(newPassword).length < 6) return res.status(400).json({ message: "new password min 6 chars" });
    const result = await dao.changePassword(req.session.currentUser._id, currentPassword, newPassword);
    if (!result.ok) return res.status(400).json({ message: result.reason });
    res.json({ message: "password updated" });
  } catch (e) {
    next(e);
  }
});

// browse creators
router.get("/creators", async (req, res, next) => {
  try {
    const list = await dao.searchCreators(req.query.q || "");
    res.json(list.map(dao.publicView));
  } catch (e) {
    next(e);
  }
});

// one creator (public)
router.get("/creators/:username", async (req, res, next) => {
  try {
    const user = await dao.findByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "creator not found" });

    // log the visit
    const me = req.session?.currentUser;
    const mine = me && me._id === user._id;

    // blocked people cannot look
    if (me && !mine && (await blocks.isBlocked(me._id, user._id))) {
      return res.status(404).json({ message: "creator not found" });
    }

    if (me && !mine) void views.record(user._id, me);

    const view = dao.publicView(user);

    // a private account only opens up for followers
    if (user.privateAccount && !mine) {
      const follows = me ? await followModel.findOne({ follower: me._id, following: user._id }) : null;
      if (!follows) {
        return res.json({
          _id: view._id,
          username: view.username,
          displayName: view.displayName,
          headline: view.headline,
          avatarUrl: view.avatarUrl,
          privateAccount: true,
          locked: true,
        });
      }
    }

    res.json(view);
  } catch (e) {
    next(e);
  }
});

export default router;
