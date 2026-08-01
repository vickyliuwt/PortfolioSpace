// auth-service/app.js
// make app

import express from "express";
import mongoose from "mongoose";
import { securityMw, requestId, corsMw, loggerMw, notFound, errorHandler } from "./shared/middleware.js";
import { makeSession } from "./shared/session.js";
import { jwtFallback } from "./shared/jwtAuth.js";
import { metricsMw, renderMetrics, metricsJson } from "./shared/metrics.js";
import userRoutes from "./users/routes.js";
import followRoutes from "./follows/routes.js";
import notificationRoutes from "./notifications/routes.js";
import messageRoutes from "./messages/routes.js";
import endorsementRoutes from "./endorsements/routes.js";
import recommendationRoutes from "./recommendations/routes.js";
import profileViewRoutes from "./profileviews/routes.js";
import blockRoutes from "./blocks/routes.js";

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

  // health (db state + uptime)
  app.get("/metrics", (req, res) => {
    res.type("text/plain; version=0.0.4").send(renderMetrics());
  });

  app.get("/metrics.json", (req, res) => res.json(metricsJson()));

  app.get("/health", (req, res) =>
    res.json({
      service: "auth",
      ok: true,
      db: mongoose.connection.readyState === 1 ? "up" : "down",
      uptime: Math.round(process.uptime()),
    })
  );

  // mount
  app.use("/follow", followRoutes);
  app.use("/notifications", notificationRoutes);
  app.use("/messages", messageRoutes);
  app.use("/endorsements", endorsementRoutes);
  app.use("/recommendations", recommendationRoutes);
  app.use("/profile-views", profileViewRoutes);
  app.use("/blocks", blockRoutes);
  app.use("/", userRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
