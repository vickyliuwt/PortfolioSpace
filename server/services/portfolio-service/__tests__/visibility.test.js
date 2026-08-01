// who can see what: drafts, private, followers only

import mongoose from "mongoose";
import request from "supertest";
import { startTestDb } from "../../../scripts/test-db.mjs";

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test_secret";
process.env.CACHE_ENABLED = "false";

let db;
let app;

beforeAll(async () => {
  db = await startTestDb();
  const { createApp } = await import("../src/app.js");
  app = await createApp();
});

afterAll(async () => {
  if (db) await db.stop();
});

// straight into the collection, no auth needed
async function seedProject(extra = {}) {
  const doc = {
    _id: `p-${Math.random().toString(36).slice(2, 10)}`,
    owner: extra.owner || "owner-1",
    ownerUsername: "owner",
    ownerName: "Owner",
    title: extra.title || "Test piece",
    summary: "a summary",
    description: "long text",
    category: "Illustration",
    kind: "art",
    tags: extra.tags || ["cats"],
    tools: ["Figma"],
    coverUrl: "/covers/cover-default.svg",
    media: [],
    visibility: extra.visibility || "PUBLIC",
    status: extra.status || "PUBLISHED",
    likes: extra.likes || 0,
    likedBy: [],
    views: 0,
    featured: !!extra.featured,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await mongoose.connection.collection("projects").insertOne(doc);
  return doc;
}

describe("discover", () => {
  test("shows public published work only", async () => {
    await seedProject({ title: "public one" });
    await seedProject({ title: "private one", visibility: "PRIVATE" });
    await seedProject({ title: "draft one", status: "DRAFT" });

    const res = await request(app).get("/discover");
    expect(res.status).toBe(200);
    const titles = res.body.map((p) => p.title);
    expect(titles).toContain("public one");
    expect(titles).not.toContain("private one");
    expect(titles).not.toContain("draft one");
  });

  test("filters by work type", async () => {
    await seedProject({ title: "code thing" });
    await mongoose.connection.collection("projects").updateOne({ title: "code thing" }, { $set: { kind: "code", category: "Web App" } });

    const res = await request(app).get("/discover?kind=code");
    expect(res.body.every((p) => p.kind === "code")).toBe(true);
  });

  test("matches words in the title", async () => {
    await seedProject({ title: "sleepy cat walk cycle" });
    const res = await request(app).get("/discover?q=sleepy");
    expect(res.body.map((p) => p.title)).toContain("sleepy cat walk cycle");
  });
});

describe("one project", () => {
  test("a stranger gets 403 on private work", async () => {
    const p = await seedProject({ visibility: "PRIVATE" });
    const res = await request(app).get(`/${p._id}`);
    expect(res.status).toBe(403);
  });

  test("a stranger gets 404 on a draft", async () => {
    const p = await seedProject({ status: "DRAFT" });
    const res = await request(app).get(`/${p._id}`);
    expect(res.status).toBe(404);
  });

  test("followers only work needs a follow", async () => {
    const p = await seedProject({ visibility: "FRIENDS" });
    const res = await request(app).get(`/${p._id}`);
    expect(res.status).toBe(403);
  });

  test("missing id gives 404", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("similar work", () => {
  test("brings back other work with the same tags", async () => {
    const base = await seedProject({ title: "base piece", tags: ["cats", "loop"] });
    await seedProject({ title: "same tags", tags: ["cats", "loop"] });
    await seedProject({ title: "different", tags: ["cars"] });

    const res = await request(app).get(`/${base._id}/similar`);
    expect(res.status).toBe(200);
    const titles = res.body.map((p) => p.title);
    expect(titles).toContain("same tags");
    expect(titles).not.toContain("base piece");
  });
});

describe("guards", () => {
  test("adding work needs a login", async () => {
    const res = await request(app).post("/").send({ title: "nope" });
    expect(res.status).toBe(401);
  });

  test("liking needs a login", async () => {
    const p = await seedProject();
    const res = await request(app).post(`/${p._id}/like`);
    expect(res.status).toBe(401);
  });

  test("my stats needs a login", async () => {
    const res = await request(app).get("/mine/stats");
    expect(res.status).toBe(401);
  });
});
