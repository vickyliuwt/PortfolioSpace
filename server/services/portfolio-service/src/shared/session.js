// shared/session.js
// one redis store for every service, so a single login works everywhere

import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";

let store; // reuse

async function buildStore() {
  if (store) return store;

  const client = createClient({ url: process.env.REDIS_URL || "redis://127.0.0.1:6379" });
  client.on("error", (e) => console.error("   redis error:", e.message));

  await client.connect();
  console.log("   redis connected");

  store = new RedisStore({ client, prefix: "ps:sess:" });
  return store;
}

export async function makeSession() {
  const isProd = process.env.NODE_ENV === "production";
  const isTest = process.env.NODE_ENV === "test";

  // test store
  const redisStore = isTest ? undefined : await buildStore();

  return session({
    store: redisStore,
    name: "ps.sid",
    secret: process.env.SESSION_SECRET || "paw_dev_secret",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
    },
  });
}
