// shared/cache.js
// tiny redis cache-aside for public lists (discover/featured)
// disables itself when redis is away

import { createClient } from "redis";

const PREFIX = "ps:cache:";
const ENABLED = process.env.CACHE_ENABLED !== "false" && process.env.NODE_ENV !== "test";

let client;
let ready = false;

async function getClient() {
  if (!ENABLED) return null;
  if (client) return ready ? client : null;

  client = createClient({ url: process.env.REDIS_URL || "redis://127.0.0.1:6379" });
  // node-redis reconnects on its own, so flip the flag back when it does
  client.on("error", () => { ready = false; }); // stay quiet, just disable cache
  client.on("ready", () => { ready = true; });
  client.on("end", () => { ready = false; });
  try {
    await client.connect();
    ready = true;
    console.log("   cache: redis connected");
  } catch {
    ready = false;
  }
  return ready ? client : null;
}

// serve a cached json copy if present, else run fn + store it
export async function cacheWrap(key, ttlSeconds, fn) {
  const c = await getClient().catch(() => null);
  const full = PREFIX + key;

  if (c) {
    try {
      const hit = await c.get(full);
      if (hit) return JSON.parse(hit);
    } catch { /* fall through to db */ }
  }

  const fresh = await fn();

  if (c) {
    try { await c.set(full, JSON.stringify(fresh), { EX: ttlSeconds }); } catch { /* ignore */ }
  }
  return fresh;
}

// clear cache
export async function cacheBust() {
  const c = await getClient().catch(() => null);
  if (!c) return;
  try {
    const keys = [];
    for await (const k of c.scanIterator({ MATCH: PREFIX + "*", COUNT: 200 })) {
      if (Array.isArray(k)) keys.push(...k);
      else keys.push(k);
    }
    if (keys.length) await c.del(keys);
  } catch { /* ignore */ }
}
