// auth integration test
// in-memory mongo, no docker needed

import { jest } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";
import { startTestDb } from "../../../scripts/test-db.mjs";

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test_secret";

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

describe("auth service", () => {
  const agent = () => request.agent(app);

  test("signup makes a creator", async () => {
    const res = await request(app).post("/signup").send({
      username: "vicky",
      password: "paw12345",
      email: "vicky@test.com",
    });
    expect(res.status).toBe(201);
    expect(res.body.username).toBe("vicky");
    expect(res.body.password).toBeUndefined(); // hidden
    expect(res.body.plan).toBe("FREE");
  });

  test("signin rejects wrong password", async () => {
    const res = await request(app).post("/signin").send({
      username: "vicky",
      password: "wrong",
    });
    expect(res.status).toBe(401);
  });

  test("profile needs a session", async () => {
    const res = await request(app).get("/profile");
    expect(res.status).toBe(401);
  });

  test("session keeps me logged in", async () => {
    const a = agent();
    await a.post("/signin").send({ username: "vicky", password: "paw12345" });
    const me = await a.get("/profile");
    expect(me.status).toBe(200);
    expect(me.body.username).toBe("vicky");
  });
});
