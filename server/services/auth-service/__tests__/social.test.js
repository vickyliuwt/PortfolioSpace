// follows, endorsements, recommendations, messages

import mongoose from "mongoose";
import request from "supertest";
import { startTestDb } from "../../../scripts/test-db.mjs";

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test_secret";
process.env.JWT_SECRET = "test_jwt";

let db;
let app;

// two signed in people
async function makeUser(name) {
  const agent = request.agent(app);
  const res = await agent.post("/signup").send({ username: name, password: "paw12345", email: `${name}@test.com` });
  return { agent, id: res.body._id, token: res.body.token };
}

beforeAll(async () => {
  db = await startTestDb();
  const { createApp } = await import("../src/app.js");
  app = await createApp();
});

afterAll(async () => {
  if (db) await db.stop();
});

describe("follows", () => {
  test("follow then unfollow moves the counts", async () => {
    const a = await makeUser("amy");
    const b = await makeUser("ben");

    const on = await a.agent.post(`/follow/${b.id}`);
    expect(on.status).toBe(200);
    expect(on.body.following).toBe(true);

    const counts = await request(app).get(`/follow/counts/${b.id}`);
    expect(counts.body.followers).toBe(1);

    const off = await a.agent.post(`/follow/${b.id}`);
    expect(off.body.following).toBe(false);
  });

  test("cannot follow myself", async () => {
    const a = await makeUser("solo");
    const res = await a.agent.post(`/follow/${a.id}`);
    expect(res.status).toBe(400);
  });
});

describe("jwt instead of a cookie", () => {
  test("bearer token reaches a guarded route", async () => {
    const u = await makeUser("tokenfan");
    expect(u.token).toBeTruthy();
    const res = await request(app).get("/profile").set("Authorization", `Bearer ${u.token}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe("tokenfan");
  });

  test("no token means 401", async () => {
    const res = await request(app).get("/profile");
    expect(res.status).toBe(401);
  });

  test("a bad token means 401", async () => {
    const res = await request(app).get("/profile").set("Authorization", "Bearer nope.nope.nope");
    expect(res.status).toBe(401);
  });
});

describe("endorsements", () => {
  test("toggles and counts", async () => {
    const a = await makeUser("endorser");
    const b = await makeUser("endorsed");

    const on = await a.agent.post("/endorsements").send({ owner: b.id, skill: "React" });
    expect(on.body.endorsed).toBe(true);
    expect(on.body.count).toBe(1);

    const read = await request(app).get(`/endorsements/${b.id}`);
    expect(read.body.React.count).toBe(1);

    const off = await a.agent.post("/endorsements").send({ owner: b.id, skill: "React" });
    expect(off.body.endorsed).toBe(false);
    expect(off.body.count).toBe(0);
  });

  test("cannot endorse myself", async () => {
    const a = await makeUser("selfskill");
    const res = await a.agent.post("/endorsements").send({ owner: a.id, skill: "Figma" });
    expect(res.status).toBe(400);
  });
});

describe("recommendations", () => {
  test("write, read, delete", async () => {
    const a = await makeUser("writer");
    const b = await makeUser("subject");

    const made = await a.agent.post("/recommendations").send({ forUser: b.id, text: "great to work with" });
    expect(made.status).toBe(201);

    const list = await request(app).get(`/recommendations/${b.id}`);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].text).toBe("great to work with");

    const gone = await a.agent.delete(`/recommendations/${made.body._id}`);
    expect(gone.status).toBe(200);
    const after = await request(app).get(`/recommendations/${b.id}`);
    expect(after.body).toHaveLength(0);
  });

  test("empty text is refused", async () => {
    const a = await makeUser("emptyrec");
    const b = await makeUser("target2");
    const res = await a.agent.post("/recommendations").send({ forUser: b.id, text: "  " });
    expect(res.status).toBe(400);
  });
});

describe("messages", () => {
  test("send, read, unsend", async () => {
    const a = await makeUser("sender");
    const b = await makeUser("receiver");

    const sent = await a.agent.post(`/messages/${b.id}`).send({ text: "hi there" });
    expect(sent.status).toBe(201);

    const convo = await b.agent.get(`/messages/with/${a.id}`);
    expect(convo.body).toHaveLength(1);
    expect(convo.body[0].text).toBe("hi there");

    const mine = await a.agent.delete(`/messages/item/${sent.body._id}`);
    expect(mine.status).toBe(200);
  });

  test("a photo with no words still sends", async () => {
    const a = await makeUser("photofan");
    const b = await makeUser("photoget");
    const res = await a.agent.post(`/messages/${b.id}`).send({ imageUrl: "http://localhost:9000/x.png" });
    expect(res.status).toBe(201);
  });

  test("a totally empty message is refused", async () => {
    const a = await makeUser("blank");
    const b = await makeUser("blank2");
    const res = await a.agent.post(`/messages/${b.id}`).send({});
    expect(res.status).toBe(400);
  });

  test("only the author can unsend", async () => {
    const a = await makeUser("owner1");
    const b = await makeUser("other1");
    const sent = await a.agent.post(`/messages/${b.id}`).send({ text: "mine" });
    const res = await b.agent.delete(`/messages/item/${sent.body._id}`);
    expect(res.status).toBe(403);
  });
});

describe("profile views", () => {
  test("opening someone else's profile is logged", async () => {
    const a = await makeUser("visitor");
    const b = await makeUser("host");
    await a.agent.get("/creators/host");
    const mine = await b.agent.get("/profile-views/mine");
    expect(mine.body.total).toBe(1);
    expect(mine.body.viewers[0].viewerUsername).toBe("visitor");
  });
});
