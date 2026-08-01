// media guard test (local driver, no minio needed)

process.env.NODE_ENV = "test";
process.env.STORAGE_DRIVER = "local";
process.env.SESSION_SECRET = "test_secret";

import request from "supertest";

let app;
beforeAll(async () => {
  const { createApp } = await import("../src/app.js");
  app = await createApp();
});

describe("media service", () => {
  test("health ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("media");
  });

  test("upload needs login", async () => {
    const res = await request(app).post("/upload");
    expect(res.status).toBe(401);
  });
});
