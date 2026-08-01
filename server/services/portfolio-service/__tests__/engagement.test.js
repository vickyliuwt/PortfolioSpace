// comments, saves and boards. these three modules had no tests at all.

import mongoose from "mongoose";
import request from "supertest";
import { startTestDb } from "../../../scripts/test-db.mjs";

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test_secret";
process.env.CACHE_ENABLED = "false";

let db;
let app;
let signToken;

const AMY = "user-amy";
const BEN = "user-ben";

beforeAll(async () => {
  db = await startTestDb();
  const { createApp } = await import("../src/app.js");
  app = await createApp();
  ({ signToken } = await import("../src/shared/jwt.js"));

  await mongoose.connection.collection("users").insertMany([
    { _id: AMY, username: "amy", displayName: "Amy", avatarUrl: "/a.svg" },
    { _id: BEN, username: "ben", displayName: "Ben", avatarUrl: "/b.svg" },
  ]);
});

afterAll(async () => {
  if (db) await db.stop();
});

const as = (id, name, role = "CREATOR") => signToken({ sub: id, username: name, role });
const amy = () => as(AMY, "amy");
const ben = () => as(BEN, "ben");

async function makeProject(token = amy(), extra = {}) {
  const res = await request(app)
    .post("/")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "A piece", kind: "art", category: "Illustration", ...extra });
  return res.body;
}

describe("comments", () => {
  test("a guest cannot write one", async () => {
    const p = await makeProject();
    const res = await request(app).post(`/comments/${p._id}`).send({ text: "hi" });
    expect(res.status).toBe(401);
  });

  test("empty words are refused", async () => {
    const p = await makeProject();
    const res = await request(app)
      .post(`/comments/${p._id}`)
      .set("Authorization", `Bearer ${ben()}`)
      .send({ text: "   " });
    expect(res.status).toBe(400);
  });

  test("a comment on nothing gives 404", async () => {
    const res = await request(app)
      .post("/comments/no-such-project")
      .set("Authorization", `Bearer ${ben()}`)
      .send({ text: "hello" });
    expect(res.status).toBe(404);
  });

  test("write one, then read it back", async () => {
    const p = await makeProject();
    const made = await request(app)
      .post(`/comments/${p._id}`)
      .set("Authorization", `Bearer ${ben()}`)
      .send({ text: "lovely work" });
    expect(made.status).toBe(201);
    expect(made.body.authorUsername).toBe("ben");

    const list = await request(app).get(`/comments/${p._id}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].text).toBe("lovely work");
  });

  test("a reply keeps a pointer to its parent", async () => {
    const p = await makeProject();
    const top = await request(app)
      .post(`/comments/${p._id}`)
      .set("Authorization", `Bearer ${ben()}`)
      .send({ text: "first" });
    const reply = await request(app)
      .post(`/comments/${p._id}`)
      .set("Authorization", `Bearer ${amy()}`)
      .send({ text: "thanks", parent: top.body._id });
    expect(reply.status).toBe(201);
    expect(reply.body.parent).toBe(top.body._id);
  });

  test("liking one toggles both ways", async () => {
    const p = await makeProject();
    const c = await request(app)
      .post(`/comments/${p._id}`)
      .set("Authorization", `Bearer ${ben()}`)
      .send({ text: "nice" });

    const on = await request(app)
      .post(`/comments/item/${c.body._id}/like`)
      .set("Authorization", `Bearer ${amy()}`);
    expect(on.status).toBe(200);
    expect(on.body.liked).toBe(true);
    expect(on.body.likes).toBe(1);

    const off = await request(app)
      .post(`/comments/item/${c.body._id}/like`)
      .set("Authorization", `Bearer ${amy()}`);
    expect(off.body.liked).toBe(false);
    expect(off.body.likes).toBe(0);
  });

  test("a reaction toggles too", async () => {
    const p = await makeProject();
    const c = await request(app)
      .post(`/comments/${p._id}`)
      .set("Authorization", `Bearer ${ben()}`)
      .send({ text: "wow" });

    const on = await request(app)
      .post(`/comments/item/${c.body._id}/react`)
      .set("Authorization", `Bearer ${amy()}`)
      .send({ emoji: "🎉" });
    expect(on.status).toBe(200);
    expect(on.body.reactions).toHaveLength(1);

    const off = await request(app)
      .post(`/comments/item/${c.body._id}/react`)
      .set("Authorization", `Bearer ${amy()}`)
      .send({ emoji: "🎉" });
    expect(off.body.reactions).toHaveLength(0);
  });

  test("only the author may delete", async () => {
    const p = await makeProject();
    const c = await request(app)
      .post(`/comments/${p._id}`)
      .set("Authorization", `Bearer ${ben()}`)
      .send({ text: "mine" });

    const nope = await request(app)
      .delete(`/comments/item/${c.body._id}`)
      .set("Authorization", `Bearer ${amy()}`);
    expect(nope.status).toBe(403);

    const yes = await request(app)
      .delete(`/comments/item/${c.body._id}`)
      .set("Authorization", `Bearer ${ben()}`);
    expect(yes.status).toBe(200);
  });
});

describe("saves", () => {
  test("a guest cannot save", async () => {
    const p = await makeProject();
    const res = await request(app).post(`/saves/${p._id}`);
    expect(res.status).toBe(401);
  });

  test("save then unsave", async () => {
    const p = await makeProject();
    const on = await request(app).post(`/saves/${p._id}`).set("Authorization", `Bearer ${ben()}`);
    expect(on.status).toBe(200);
    expect(on.body.saved).toBe(true);

    const check = await request(app).get(`/saves/check/${p._id}`).set("Authorization", `Bearer ${ben()}`);
    expect(check.body.saved).toBe(true);

    const off = await request(app).post(`/saves/${p._id}`).set("Authorization", `Bearer ${ben()}`);
    expect(off.body.saved).toBe(false);
  });

  test("the saved list and the id list agree", async () => {
    const p = await makeProject();
    await request(app).post(`/saves/${p._id}`).set("Authorization", `Bearer ${ben()}`);

    const ids = await request(app).get("/saves/ids").set("Authorization", `Bearer ${ben()}`);
    expect(ids.body).toContain(p._id);

    const full = await request(app).get("/saves").set("Authorization", `Bearer ${ben()}`);
    expect(full.body.map((x) => x._id)).toContain(p._id);
  });

  test("a private project drops out of the saved list", async () => {
    const p = await makeProject(amy());
    await request(app).post(`/saves/${p._id}`).set("Authorization", `Bearer ${ben()}`);

    await request(app)
      .put(`/${p._id}`)
      .set("Authorization", `Bearer ${amy()}`)
      .send({ visibility: "PRIVATE" });

    const full = await request(app).get("/saves").set("Authorization", `Bearer ${ben()}`);
    expect(full.body.map((x) => x._id)).not.toContain(p._id);
  });
});

describe("boards", () => {
  async function makeBoard(token = amy(), body = {}) {
    const res = await request(app)
      .post("/collections")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Moodboard", ...body });
    return res;
  }

  test("a guest cannot make one", async () => {
    const res = await request(app).post("/collections").send({ title: "nope" });
    expect(res.status).toBe(401);
  });

  test("a board needs a title", async () => {
    const res = await makeBoard(amy(), { title: "  " });
    expect(res.status).toBe(400);
  });

  test("make one and find it in mine", async () => {
    const made = await makeBoard();
    expect(made.status).toBe(201);

    const mine = await request(app).get("/collections/mine").set("Authorization", `Bearer ${amy()}`);
    expect(mine.body.map((c) => c._id)).toContain(made.body._id);
  });

  test("renaming works and only for the owner", async () => {
    const made = await makeBoard();

    const nope = await request(app)
      .put(`/collections/${made.body._id}`)
      .set("Authorization", `Bearer ${ben()}`)
      .send({ title: "stolen" });
    expect(nope.status).toBe(403);

    const yes = await request(app)
      .put(`/collections/${made.body._id}`)
      .set("Authorization", `Bearer ${amy()}`)
      .send({ title: "Renamed" });
    expect(yes.status).toBe(200);
    expect(yes.body.title).toBe("Renamed");
  });

  test("adding and removing a project", async () => {
    const made = await makeBoard();
    const p = await makeProject();

    const add = await request(app)
      .post(`/collections/${made.body._id}/items/${p._id}`)
      .set("Authorization", `Bearer ${amy()}`);
    expect(add.status).toBe(200);

    const open = await request(app).get(`/collections/${made.body._id}`);
    expect(open.body.projects.map((x) => x._id)).toContain(p._id);

    const drop = await request(app)
      .delete(`/collections/${made.body._id}/items/${p._id}`)
      .set("Authorization", `Bearer ${amy()}`);
    expect(drop.status).toBe(200);
  });

  test("a private project inside a public board stays hidden from strangers", async () => {
    const made = await makeBoard();
    const p = await makeProject(amy(), { visibility: "PRIVATE" });
    await request(app)
      .post(`/collections/${made.body._id}/items/${p._id}`)
      .set("Authorization", `Bearer ${amy()}`);

    const guest = await request(app).get(`/collections/${made.body._id}`);
    expect(guest.status).toBe(200);
    expect(guest.body.projects.map((x) => x._id)).not.toContain(p._id);

    const owner = await request(app)
      .get(`/collections/${made.body._id}`)
      .set("Authorization", `Bearer ${amy()}`);
    expect(owner.body.projects.map((x) => x._id)).toContain(p._id);
  });

  test("a private board is hidden from everyone else", async () => {
    const made = await makeBoard(amy(), { visibility: "PRIVATE" });
    const guest = await request(app).get(`/collections/${made.body._id}`);
    expect(guest.status).toBe(404);
  });

  test("only the owner may delete", async () => {
    const made = await makeBoard();
    const nope = await request(app)
      .delete(`/collections/${made.body._id}`)
      .set("Authorization", `Bearer ${ben()}`);
    expect(nope.status).toBe(403);

    const yes = await request(app)
      .delete(`/collections/${made.body._id}`)
      .set("Authorization", `Bearer ${amy()}`);
    expect(yes.status).toBe(200);
  });
});
