// gateway/index.js
// one public port, proxies every /api/* call to the right service

import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuid } from "uuid";
import { createProxyMiddleware } from "http-proxy-middleware";
import { metricsMw, renderMetrics, metricsJson } from "./shared/metrics.js";
import { openapiSpec, docsPage } from "./openapi.js";

const PORT = process.env.PORT || 4000;

const AUTH_URL = process.env.AUTH_URL || "http://localhost:4001";
const PORTFOLIO_URL = process.env.PORTFOLIO_URL || "http://localhost:4002";
const MEDIA_URL = process.env.MEDIA_URL || "http://localhost:4003";
const SEARCH_URL = process.env.SEARCH_URL || "http://localhost:4004";
const MODERATION_URL = process.env.MODERATION_URL || "http://localhost:4005";

const SERVICES = { auth: AUTH_URL, portfolio: PORTFOLIO_URL, media: MEDIA_URL, search: SEARCH_URL, moderation: MODERATION_URL };

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

// headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// request id
process.env.SERVICE_NAME = process.env.SERVICE_NAME || "gateway";

app.use(metricsMw());

app.use((req, res, next) => {
  const incoming = req.headers["x-request-id"];
  req.id = (Array.isArray(incoming) ? incoming[0] : incoming) || uuid();
  req.headers["x-request-id"] = req.id;
  res.setHeader("X-Request-Id", req.id);
  next();
});

morgan.token("id", (req) => req.id || "-");
app.use(
  morgan(
    process.env.NODE_ENV === "production"
      ? ':remote-addr :id ":method :url" :status - :response-time ms'
      : ":id :method :url :status :response-time ms"
  )
);

const gwCors = cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true });

// health

app.get("/", (req, res) => res.json({ service: "PortfolioSpace gateway", ok: true }));

// prometheus scrape
app.get("/metrics", (req, res) => res.type("text/plain; version=0.0.4").send(renderMetrics()));

// everyone's numbers in one json
app.get("/api/metrics", gwCors, async (req, res) => {
  const mine = metricsJson();
  const others = await Promise.all(
    Object.entries(SERVICES).map(async ([name, url]) => {
      try {
        const r = await fetch(`${url}/metrics.json`, { signal: AbortSignal.timeout(2500) });
        return [name, r.ok ? await r.json() : { error: "bad status" }];
      } catch (e) {
        return [name, { error: e.name === "TimeoutError" ? "timeout" : e.message }];
      }
    })
  );
  res.json({ gateway: mine, services: Object.fromEntries(others), time: new Date().toISOString() });
});

// api reference
app.get("/api/openapi.json", gwCors, (req, res) => res.json(openapiSpec()));
app.get("/api/docs", (req, res) => res.type("html").send(docsPage()));

// health check
app.get("/api/health", gwCors, async (req, res) => {
  const checks = await Promise.all(
    Object.entries(SERVICES).map(async ([name, url]) => {
      try {
        const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2500) });
        const body = await r.json().catch(() => ({}));
        return [name, { up: r.ok, ...body }];
      } catch (e) {
        return [name, { up: false, error: e.name === "TimeoutError" ? "timeout" : e.message }];
      }
    })
  );
  const services = Object.fromEntries(checks);
  const allUp = Object.values(services).every((s) => s.up);
  res.status(allUp ? 200 : 503).json({
    gateway: "ok",
    healthy: allUp,
    services,
    requestId: req.id,
    time: new Date().toISOString(),
  });
});

// rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT || 600),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: false, // skip dev-only proxy validation (avoids false errors behind a proxy)
  message: { message: "too many requests, slow down a little 🐾" },
});
app.use("/api", limiter);

// each service sees the path with its /api/<name> prefix removed
function mkProxy(target, service, prefix) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    prependPath: true,
    proxyTimeout: 60000,
    timeout: 60000,
    pathFilter: (pathname) => pathname.startsWith(prefix),
    pathRewrite: (path) => path.slice(prefix.length) || "/", // drop the /api/<x> prefix
    on: {
      error(err, req, res) {
        const rid = req?.headers?.["x-request-id"] || "-";
        console.error(`   [${rid}] proxy error -> ${service}:`, err.message || err);
        if (res && !res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: `${service} service unavailable, try again`, requestId: rid }));
        }
      },
    },
  });
}

// auth:     /api/auth/*     -> auth-service      /*
app.use(mkProxy(AUTH_URL, "auth", "/api/auth"));
// search:   /api/search/*   -> search-service    /*
app.use(mkProxy(SEARCH_URL, "search", "/api/search"));
// reports:  /api/moderation/* -> moderation-service /*
app.use(mkProxy(MODERATION_URL, "moderation", "/api/moderation"));
// projects, comments, saves, collections, stories all ride this one
app.use(mkProxy(PORTFOLIO_URL, "portfolio", "/api/projects"));
// media:    /api/media/*    -> media-service     /*
app.use(mkProxy(MEDIA_URL, "media", "/api/media"));

const server = app.listen(PORT, () => {
  console.log(`[gateway] listening on :${PORT}`);
  // one line per service, so a missing one is obvious
  for (const [name, url] of Object.entries(SERVICES)) {
    console.log(`   ${name.padEnd(10)} -> ${url}`);
  }
  console.log(`   docs       -> http://localhost:${PORT}/api/docs`);
});

const shutdown = (sig) => {
  console.log(`[gateway] ${sig} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 8000).unref();
};
["SIGINT", "SIGTERM"].forEach((s) => process.on(s, () => shutdown(s)));
