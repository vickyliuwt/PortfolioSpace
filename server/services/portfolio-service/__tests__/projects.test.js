// portfolio integration test (in-memory mongo)

import mongoose from "mongoose";
import request from "supertest";
import { v4 as uuid } from "uuid";
import { startTestDb } from "../../../scripts/test-db.mjs";

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test_secret";

let mongod, app, projectModel;

beforeAll(async () => {
  db = await startTestDb();
  const mod = await import("../src/projects/model.js");
  projectModel = mod.default;
  const { createApp } = await import("../src/app.js");
  app = await createApp();
});

afterAll(async () => {
  if (db) await db.stop();
});

describe("portfolio service", () => {
  test("discover empty at first", async () => {
    const res = await request(app).get("/discover");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("public project shows in discover", async () => {
    await projectModel.create({
      _id: uuid(), owner: "u1", ownerUsername: "u1", ownerName: "User One",
      title: "Test Reel", summary: "hi", category: "Animation",
      tags: ["demo"], visibility: "PUBLIC",
    });
    const res = await request(app).get("/discover?q=reel");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("Test Reel");
  });

  test("creating a project needs login", async () => {
    const res = await request(app).post("/").send({ title: "Nope" });
    expect(res.status).toBe(401);
  });
});
