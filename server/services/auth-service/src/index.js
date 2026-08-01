// auth-service/index.js
import "dotenv/config";

process.env.SERVICE_NAME = process.env.SERVICE_NAME || "auth";
import mongoose from "mongoose";
import { connectDb } from "./shared/db.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 4001;

async function main() {
  await connectDb(process.env.MONGO_URL, "auth");
  const app = await createApp();
  const server = app.listen(PORT, () => console.log(`[auth] listening on :${PORT}`));

  // graceful shutdown (docker sends SIGTERM)
  const shutdown = (sig) => {
    console.log(`[auth] ${sig} received, shutting down`);
    server.close(async () => {
      try { await mongoose.connection.close(); } catch { /* ignore */ }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 8000).unref();
  };
  ["SIGINT", "SIGTERM"].forEach((s) => process.on(s, () => shutdown(s)));
}

main().catch((e) => {
  console.error("[auth] boot failed:", e);
  process.exit(1);
});
