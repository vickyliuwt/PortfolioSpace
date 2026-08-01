// team credits: who gets listed, who may edit

import mongoose from "mongoose";
import request from "supertest";
import { startTestDb } from "../../../scripts/test-db.mjs";

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test_secret";
process.env.CACHE_ENABLED = "false";

let db;
let app;
let signToken;

const OWNER = "user-owner";
const MATE = "user-mate";
const STRANGER = "user-stranger";

beforeAll(async () => {
  db = await startTestDb();
  const { createApp } = await import("../src/app.js");
  app = await createApp();
  ({ signToken } = await import("../src/shared/jwt.js"));

  await mongoose.connection.collection("users").insertMany([
    { _id: OWNER, username: "owner", displayName: "The Owner", avatarUrl: "/a.svg" },
    { _id: MATE, username: "mate", displayName: "Team Mate", avatarUrl: "/b.svg" },
    { _id: STRANGER, username: "stranger", displayName: "Some Stranger", avatarUrl: "" },
  ]);
});

afterAll(async () => {
  if (db) await db.stop();
});

// bearer token, no session needed
function as(userId, username) {
  return signToken({ sub: userId, username });
}

async function makeProject(extra = {}) {
  const res = await request(app)
    .post("/")
    .set("Authorization", `Bearer ${as(OWNER, "owner")}`)
    .send({ title: "Team piece", kind: "film", category: "Animation", ...extra });
  return res;
}

describe("crediting people", () => {
  test("turns a handle into a real person", async () => {
    const res = await makeProject({ collaborators: [{ username: "mate", role: "Sound design" }] });
    expect(res.status).toBe(201);
    expect(res.body.collaborators).toHaveLength(1);
    expect(res.body.collaborators[0]).toMatchObject({
      user: MATE,
      username: "mate",
      name: "Team Mate",
      role: "Sound design",
    });
  });

  test("takes a plain string with an at sign", async () => {
    const res = await makeProject({ collaborators: ["@mate"] });
    expect(res.body.collaborators.map((c) => c.user)).toEqual([MATE]);
  });

  test("skips handles nobody owns", async () => {
    const res = await makeProject({ collaborators: ["ghost-person"] });
    expect(res.body.collaborators).toHaveLength(0);
  });

  test("never credits the owner twice", async () => {
    const res = await makeProject({ collaborators: ["owner", "mate"] });
    expect(res.body.collaborators.map((c) => c.user)).toEqual([MATE]);
  });

  test("drops repeats of the same person", async () => {
    const res = await makeProject({ collaborators: ["mate", "@mate", "MATE"] });
    expect(res.body.collaborators).toHaveLength(1);
  });
});

describe("what a teammate may do", () => {
  test("they can edit the work", async () => {
    const made = await makeProject({ collaborators: ["mate"] });
    const res = await request(app)
      .put(`/${made.body._id}`)
      .set("Authorization", `Bearer ${as(MATE, "mate")}`)
      .send({ title: "Retitled by the teammate" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Retitled by the teammate");
  });

  test("they cannot change who is credited", async () => {
    const made = await makeProject({ collaborators: ["mate"] });
    const res = await request(app)
      .put(`/${made.body._id}`)
      .set("Authorization", `Bearer ${as(MATE, "mate")}`)
      .send({ collaborators: ["stranger"] });
    expect(res.status).toBe(200);
    expect(res.body.collaborators.map((c) => c.user)).toEqual([MATE]);
  });

  test("they cannot delete it", async () => {
    const made = await makeProject({ collaborators: ["mate"] });
    const res = await request(app)
      .delete(`/${made.body._id}`)
      .set("Authorization", `Bearer ${as(MATE, "mate")}`);
    expect(res.status).toBe(403);
  });

  test("an outsider still cannot edit", async () => {
    const made = await makeProject({ collaborators: ["mate"] });
    const res = await request(app)
      .put(`/${made.body._id}`)
      .set("Authorization", `Bearer ${as(STRANGER, "stranger")}`)
      .send({ title: "nope" });
    expect(res.status).toBe(403);
  });

  test("the owner can swap the list", async () => {
    const made = await makeProject({ collaborators: ["mate"] });
    const res = await request(app)
      .put(`/${made.body._id}`)
      .set("Authorization", `Bearer ${as(OWNER, "owner")}`)
      .send({ collaborators: ["stranger"] });
    expect(res.body.collaborators.map((c) => c.user)).toEqual([STRANGER]);
  });
});

describe("seeing shared work", () => {
  test("a teammate opens a draft that others cannot", async () => {
    const made = await makeProject({ collaborators: ["mate"], status: "DRAFT" });

    const hidden = await request(app).get(`/${made.body._id}`);
    expect(hidden.status).toBe(404);

    const shown = await request(app)
      .get(`/${made.body._id}`)
      .set("Authorization", `Bearer ${as(MATE, "mate")}`);
    expect(shown.status).toBe(200);
  });

  test("a teammate opens private work", async () => {
    const made = await makeProject({ collaborators: ["mate"], visibility: "PRIVATE" });
    const res = await request(app)
      .get(`/${made.body._id}`)
      .set("Authorization", `Bearer ${as(MATE, "mate")}`);
    expect(res.status).toBe(200);
  });

  test("shared work lands in the teammate's studio", async () => {
    const made = await makeProject({ collaborators: ["mate"], title: "Shows in my studio" });
    const res = await request(app).get("/mine").set("Authorization", `Bearer ${as(MATE, "mate")}`);
    expect(res.status).toBe(200);
    expect(res.body.map((p) => p._id)).toContain(made.body._id);
  });

  test("public credit shows on their profile", async () => {
    const made = await makeProject({ collaborators: ["mate"], title: "Credited in public" });
    const res = await request(app).get(`/by/${MATE}`);
    expect(res.body.map((p) => p._id)).toContain(made.body._id);
  });

  test("a private project never leaks onto their profile", async () => {
    const made = await makeProject({ collaborators: ["mate"], visibility: "PRIVATE", title: "Kept back" });
    const res = await request(app).get(`/by/${MATE}`);
    expect(res.body.map((p) => p._id)).not.toContain(made.body._id);
  });

  test("a draft never leaks onto their profile", async () => {
    const made = await makeProject({ collaborators: ["mate"], status: "DRAFT", title: "Still a draft" });
    const res = await request(app).get(`/by/${MATE}`);
    expect(res.body.map((p) => p._id)).not.toContain(made.body._id);
  });
});
