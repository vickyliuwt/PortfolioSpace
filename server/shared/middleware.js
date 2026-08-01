// shared/middleware.js
// cors + guards + errors

import cors from "cors";
import morgan from "morgan";

// cors with cookies
export function corsMw() {
  return cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}

// request log
export function loggerMw() {
  return morgan(process.env.NODE_ENV === "production" ? "combined" : "dev");
}

// must be logged in
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.currentUser) {
    return res.status(401).json({ message: "please sign in first" });
  }
  next();
}

// must have a role
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
  res.status(404).json({ message: `not found: ${req.method} ${req.originalUrl}` });
}

// error catcher
export function errorHandler(err, req, res, next) {
  console.error("   error:", err.message);
  const code = err.statusCode || 500;
  res.status(code).json({
    message: err.message || "server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
