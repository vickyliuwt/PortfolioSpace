// media-service/app.js
import express from "express";
import { securityMw, requestId, corsMw, loggerMw, notFound, errorHandler } from "./shared/middleware.js";
import { makeSession } from "./shared/session.js";
import { jwtFallback } from "./shared/jwtAuth.js";
import { metricsMw, renderMetrics, metricsJson } from "./shared/metrics.js";
import mediaRoutes from "./media/routes.js";
import { driver } from "./media/storage.js";

export async function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(securityMw());
  app.use(requestId());
  app.use(corsMw());
  app.use(loggerMw());
  app.use(express.json({ limit: "2mb" }));
  app.use(await makeSession());
  app.use(jwtFallback());
  app.use(metricsMw());

  app.get("/metrics", (req, res) => {
    res.type("text/plain; version=0.0.4").send(renderMetrics());
  });

  app.get("/metrics.json", (req, res) => res.json(metricsJson()));

  app.get("/health", (req, res) =>
    res.json({ service: "media", ok: true, storage: driver, uptime: Math.round(process.uptime()) })
  );

  // gateway strips /api/media -> "/"
  app.use("/", mediaRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
