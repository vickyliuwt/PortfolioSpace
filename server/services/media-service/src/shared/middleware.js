// shared/middleware.js
// middleware

import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { v4 as uuid } from "uuid";

// security headers (safe for a json api that also serves/embeds media)
export function securityMw() {
  return helmet({
    contentSecurityPolicy: false, // api, not html
    crossOriginResourcePolicy: { policy: "cross-origin" }, // let the client embed media
    crossOriginEmbedderPolicy: false,
  });
}

// tag every request with an id (reuse the gateway's if it sent one)
export function requestId() {
  return (req, res, next) => {
    const incoming = req.headers["x-request-id"];
    req.id = (Array.isArray(incoming) ? incoming[0] : incoming) || uuid();
    res.setHeader("X-Request-Id", req.id);
    next();
  };
}

// cors with cookies
export function corsMw() {
  return cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  });
}

// request log (adds the request id)
export function loggerMw() {
  morgan.token("id", (req) => req.id || "-");
  const fmt =
    process.env.NODE_ENV === "production"
      ? ':remote-addr :id ":method :url" :status :res[content-length] - :response-time ms'
      : ":id :method :url :status :response-time ms";
  return morgan(fmt);
}

// must be logged in
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.currentUser) {
    return res.status(401).json({ message: "please sign in first" });
  }
  next();
}

// must have one of these roles
export function requireRole(...roles) {
  return (req, res, next) => {
    const user = req.session?.currentUser;
    if (!user) return res.status(401).json({ message: "please sign in first" });
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "you cannot do that" });
    }
    next();
  };
}

// 404
export function notFound(req, res) {
  res.status(404).json({ message: `not found: ${req.method} ${req.originalUrl}`, requestId: req.id });
}

// error catcher (last)
export function errorHandler(err, req, res, next) {
  const code = err.statusCode || err.status || 500;
  console.error(`   [${req.id || "-"}] error ${code}:`, err.message);
  res.status(code).json({
    message: err.message || "server error",
    requestId: req.id,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
