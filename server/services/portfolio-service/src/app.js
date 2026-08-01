// portfolio-service/app.js
import express from "express";
import mongoose from "mongoose";
import { securityMw, requestId, corsMw, loggerMw, notFound, errorHandler } from "./shared/middleware.js";
import { makeSession } from "./shared/session.js";
import { jwtFallback } from "./shared/jwtAuth.js";
import { metricsMw, renderMetrics, metricsJson } from "./shared/metrics.js";
import projectRoutes from "./projects/routes.js";
import commentRoutes from "./comments/routes.js";
import saveRoutes from "./saves/routes.js";
import collectionRoutes from "./collections/routes.js";
import storyRoutes from "./stories/routes.js";

export async function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(securityMw());
  app.use(requestId());
  app.use(corsMw());
  app.use(loggerMw());
  app.use(express.json({ limit: "4mb" }));
  app.use(await makeSession());
  app.use(jwtFallback());
  app.use(metricsMw());

  app.get("/metrics", (req, res) => {
    res.type("text/plain; version=0.0.4").send(renderMetrics());
  });

  app.get("/metrics.json", (req, res) => res.json(metricsJson()));

  app.get("/health", (req, res) =>
    res.json({
      service: "portfolio",
      ok: true,
      db: mongoose.connection.readyState === 1 ? "up" : "down",
      uptime: Math.round(process.uptime()),
    })
  );

  // gateway strips /api/projects -> "/" (so /api/projects/comments -> /comments, /saves, /collections)
  app.use("/comments", commentRoutes);
  app.use("/saves", saveRoutes);
  app.use("/collections", collectionRoutes);
  app.use("/stories", storyRoutes);
  app.use("/", projectRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
