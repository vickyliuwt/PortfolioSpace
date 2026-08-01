// search routes. elasticsearch is not running here, which is the point:
// this covers the fallback answers the app actually gives most of the time.

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test_secret";
process.env.ES_URL = "http://127.0.0.1:59999"; // nothing listens here

import request from "supertest";
import { startTestDb } from "../../../scripts/test-db.mjs";

let db;
let app;
let signToken;

// reindex reads mongo. without a connection those reads sit in mongoose's
// buffer, time out ten seconds after the run and take the process down with
// them, so the suite passes but the exit code does not.
beforeAll(async () => {
  db = await startTestDb();
  const { createApp } = await import("../src/app.js");
  app = await createApp();
  ({ signToken } = await import("../src/shared/jwt.js"));
});

afterAll(async () => {
  if (db) await db.stop();
});

const asUser = () => signToken({ sub: "u-1", username: "amy", role: "CREATOR" });
const asAdmin = () => signToken({ sub: "u-2", username: "boss", role: "ADMIN" });

describe("health", () => {
  test("answers and reports elasticsearch as down", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("search");
    expect(res.body.elasticsearch).toBe("down");
  });
});

describe("project search without elasticsearch", () => {
  test("says so instead of failing", async () => {
    const res = await request(app).get("/projects");
    expect(res.status).toBe(200);
    expect(res.body.es).toBe(false);
    expect(res.body.total).toBe(0);
    expect(res.body.hits).toEqual([]);
  });

  test("a keyword still comes back cleanly", async () => {
    const res = await request(app).get("/projects?q=sleepy");
    expect(res.status).toBe(200);
    expect(res.body.es).toBe(false);
  });

  test("filters do not change that", async () => {
    const res = await request(app).get("/projects?q=cat&kind=code&category=Web%20App");
    expect(res.status).toBe(200);
    expect(res.body.es).toBe(false);
  });

  test("an oversized limit is accepted", async () => {
    const res = await request(app).get("/projects?limit=9999");
    expect(res.status).toBe(200);
    expect(res.body.es).toBe(false);
  });
});

describe("suggest", () => {
  test("an empty query answers straight away", async () => {
    const res = await request(app).get("/suggest");
    expect(res.status).toBe(200);
    expect(res.body.es).toBe(true);
    expect(res.body.hits).toEqual([]);
  });

  test("a real query falls back when nothing answers", async () => {
    const res = await request(app).get("/suggest?q=paw");
    expect(res.status).toBe(200);
    expect(res.body.es).toBe(false);
    expect(res.body.hits).toEqual([]);
  });
});

describe("guards", () => {
  test("message search needs a login", async () => {
    const res = await request(app).get("/messages?q=hi");
    expect(res.status).toBe(401);
  });

  test("reindex needs a login", async () => {
    const res = await request(app).post("/reindex");
    expect(res.status).toBe(401);
  });

  test("reindex is admins only", async () => {
    const res = await request(app).post("/reindex").set("Authorization", `Bearer ${asUser()}`);
    expect(res.status).toBe(403);
  });

  test("indexing one project needs a login", async () => {
    const res = await request(app).post("/index/project/p-1");
    expect(res.status).toBe(401);
  });
});

describe("a signed in reader", () => {
  test("message search answers even with elasticsearch away", async () => {
    const res = await request(app).get("/messages?q=hi").set("Authorization", `Bearer ${asUser()}`);
    expect(res.status).toBe(200);
    expect(res.body.es).toBe(false);
  });

  test("an admin gets past the role gate", async () => {
    const res = await request(app).post("/reindex").set("Authorization", `Bearer ${asAdmin()}`);
    // elasticsearch is away, so this cannot finish. the point is that it is
    // refused for a reason other than the role, and that it answers at all
    // rather than hanging. any 500 logged above this line is expected.
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    expect(res.body).toBeTruthy();
  });
});

describe("unknown paths", () => {
  test("give a tidy 404", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.message).toContain("not found");
  });
});
