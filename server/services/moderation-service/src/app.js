// moderation-service/app.js
import express from "express";
import mongoose from "mongoose";
import { securityMw, requestId, corsMw, loggerMw, notFound, errorHandler } from "./shared/middleware.js";
import { makeSession } from "./shared/session.js";
import { jwtFallback } from "./shared/jwtAuth.js";
import { metricsMw, renderMetrics, metricsJson } from "./shared/metrics.js";
import reportRoutes from "./routes.js";

export async function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(securityMw());
  app.use(requestId());
  app.use(corsMw());
  app.use(loggerMw());
  app.use(express.json({ limit: "1mb" }));
  app.use(await makeSession());
  app.use(jwtFallback());
  app.use(metricsMw());

  app.get("/metrics", (req, res) => res.type("text/plain; version=0.0.4").send(renderMetrics()));
  app.get("/metrics.json", (req, res) => res.json(metricsJson()));

  app.get("/health", (req, res) =>
    res.json({
      service: "moderation",
      ok: true,
      db: mongoose.connection.readyState === 1 ? "up" : "down",
      uptime: Math.round(process.uptime()),
    })
  );

  app.use("/", reportRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
