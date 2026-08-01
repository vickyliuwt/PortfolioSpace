// shared/jwt.js
// tiny jwt

import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "paw_dev_secret";
const TTL = Number(process.env.JWT_TTL_SECONDS) || 7 * 24 * 60 * 60;

const b64 = (buf) => Buffer.from(buf).toString("base64url");
const unb64 = (str) => Buffer.from(str, "base64url").toString("utf8");

function sign(data) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

// sign
export function signToken(payload, ttl = TTL) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64(JSON.stringify({ ...payload, iat: now, exp: now + ttl }));
  return `${head}.${body}.${sign(`${head}.${body}`)}`;
}

// verify
export function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [head, body, sig] = parts;
  const expected = sign(`${head}.${body}`);

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const claims = JSON.parse(unb64(body));
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

// read header
export function tokenFrom(req) {
  const h = req.headers?.authorization || "";
  if (h.startsWith("Bearer ")) return h.slice(7).trim();
  return req.headers?.["x-access-token"] || null;
}
