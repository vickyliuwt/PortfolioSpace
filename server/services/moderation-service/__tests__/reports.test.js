// reports: who can file, who can act, what a takedown removes

import mongoose from "mongoose";
import request from "supertest";
import { startTestDb } from "../../../scripts/test-db.mjs";

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test_secret";

let db;
let app;
let signToken;

const REPORTER = "user-reporter";
const ADMIN = "user-admin";

beforeAll(async () => {
  db = await startTestDb();
  const { createApp } = await import("../src/app.js");
  app = await createApp();
  ({ signToken } = await import("../src/shared/jwt.js"));
});

afterAll(async () => {
  if (db) await db.stop();
});

beforeEach(async () => {
  await mongoose.connection.collection("reports").deleteMany({});
});

const asUser = () => signToken({ sub: REPORTER, username: "reporter", role: "CREATOR" });
const asAdmin = () => signToken({ sub: ADMIN, username: "boss", role: "ADMIN" });

function file(token, body) {
  return request(app).post("/").set("Authorization", `Bearer ${token}`).send(body);
}

describe("filing a report", () => {
  test("a signed in person can file one", async () => {
    const res = await file(asUser(), { targetType: "project", targetId: "p-1", reason: "not their work" });
    expect(res.status).toBe(201);
    expect(res.body._id).toBeTruthy();
  });

  test("a guest cannot", async () => {
    const res = await request(app).post("/").send({ targetType: "project", targetId: "p-1" });
    expect(res.status).toBe(401);
  });

  test("a made up target type is refused", async () => {
    const res = await file(asUser(), { targetType: "banana", targetId: "p-1" });
    expect(res.status).toBe(400);
  });

  test("a missing target id is refused", async () => {
    const res = await file(asUser(), { targetType: "project" });
    expect(res.status).toBe(400);
  });

  test("a very long reason gets trimmed", async () => {
    const res = await file(asUser(), { targetType: "comment", targetId: "c-1", reason: "x".repeat(900) });
    expect(res.status).toBe(201);
    const row = await mongoose.connection.collection("reports").findOne({ _id: res.body._id });
    expect(row.reason.length).toBe(500);
  });
});

describe("the queue is admin only", () => {
  test("a normal person cannot read it", async () => {
    const res = await request(app).get("/").set("Authorization", `Bearer ${asUser()}`);
    expect(res.status).toBe(403);
  });

  test("a normal person cannot see the count", async () => {
    const res = await request(app).get("/count").set("Authorization", `Bearer ${asUser()}`);
    expect(res.status).toBe(403);
  });

  test("a normal person cannot change a status", async () => {
    const made = await file(asUser(), { targetType: "project", targetId: "p-2" });
    const res = await request(app)
      .put(`/${made.body._id}`)
      .set("Authorization", `Bearer ${asUser()}`)
      .send({ status: "RESOLVED" });
    expect(res.status).toBe(403);
  });

  test("an admin reads the open queue", async () => {
    await file(asUser(), { targetType: "project", targetId: "p-3" });
    const res = await request(app).get("/").set("Authorization", `Bearer ${asAdmin()}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe("OPEN");
  });

  test("an admin sees the open count", async () => {
    await file(asUser(), { targetType: "project", targetId: "p-4" });
    const res = await request(app).get("/count").set("Authorization", `Bearer ${asAdmin()}`);
    expect(res.body.open).toBe(1);
  });
});

describe("working through the queue", () => {
  test("an admin resolves one", async () => {
    const made = await file(asUser(), { targetType: "project", targetId: "p-5" });
    const res = await request(app)
      .put(`/${made.body._id}`)
      .set("Authorization", `Bearer ${asAdmin()}`)
      .send({ status: "RESOLVED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("RESOLVED");
  });

  test("a junk status is refused", async () => {
    const made = await file(asUser(), { targetType: "project", targetId: "p-6" });
    const res = await request(app)
      .put(`/${made.body._id}`)
      .set("Authorization", `Bearer ${asAdmin()}`)
      .send({ status: "WHATEVER" });
    expect(res.status).toBe(400);
  });

  test("taking a project down deletes it and closes the report", async () => {
    await mongoose.connection.collection("projects").insertOne({ _id: "p-7", title: "bad one" });
    const made = await file(asUser(), { targetType: "project", targetId: "p-7" });

    const res = await request(app)
      .post(`/${made.body._id}/remove-target`)
      .set("Authorization", `Bearer ${asAdmin()}`)
      .send({ targetType: "project", targetId: "p-7" });
    expect(res.status).toBe(200);

    const gone = await mongoose.connection.collection("projects").findOne({ _id: "p-7" });
    expect(gone).toBeNull();

    const row = await mongoose.connection.collection("reports").findOne({ _id: made.body._id });
    expect(row.status).toBe("RESOLVED");
  });

  test("a takedown with a junk type removes nothing", async () => {
    await mongoose.connection.collection("projects").insertOne({ _id: "p-8", title: "keep me" });
    const made = await file(asUser(), { targetType: "project", targetId: "p-8" });

    const res = await request(app)
      .post(`/${made.body._id}/remove-target`)
      .set("Authorization", `Bearer ${asAdmin()}`)
      .send({ targetType: "banana", targetId: "p-8" });
    expect(res.status).toBe(400);

    const still = await mongoose.connection.collection("projects").findOne({ _id: "p-8" });
    expect(still).not.toBeNull();
  });

  test("a normal person cannot take anything down", async () => {
    const made = await file(asUser(), { targetType: "project", targetId: "p-9" });
    const res = await request(app)
      .post(`/${made.body._id}/remove-target`)
      .set("Authorization", `Bearer ${asUser()}`)
      .send({ targetType: "project", targetId: "p-9" });
    expect(res.status).toBe(403);
  });
});

describe("health", () => {
  test("it answers", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("moderation");
  });
});
