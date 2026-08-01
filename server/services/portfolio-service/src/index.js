// portfolio-service/index.js
import "dotenv/config";

process.env.SERVICE_NAME = process.env.SERVICE_NAME || "portfolio";
import mongoose from "mongoose";
import { connectDb } from "./shared/db.js";
import { createApp } from "./app.js";
import { runSeed } from "../seed/seed.js";

const PORT = process.env.PORT || 4002;

async function main() {
  await connectDb(process.env.MONGO_URL, "portfolio");

  // optional demo data on first boot
  if (process.env.SEED_ON_START === "true") {
    await runSeed().catch((e) => console.error("[portfolio] seed skipped:", e.message));
  }

  const app = await createApp();
  const server = app.listen(PORT, () => console.log(`[portfolio] listening on :${PORT}`));

  const shutdown = (sig) => {
    console.log(`[portfolio] ${sig} received, shutting down`);
    server.close(async () => {
      try { await mongoose.connection.close(); } catch { /* ignore */ }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 8000).unref();
  };
  ["SIGINT", "SIGTERM"].forEach((s) => process.on(s, () => shutdown(s)));
}

main().catch((e) => {
  console.error("[portfolio] boot failed:", e);
  process.exit(1);
});
