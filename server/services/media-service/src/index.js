// media-service/index.js
import "dotenv/config";

process.env.SERVICE_NAME = process.env.SERVICE_NAME || "media";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 4003;

async function main() {
  const app = await createApp();
  const server = app.listen(PORT, () =>
    console.log(`[media] listening on :${PORT} (driver=${process.env.STORAGE_DRIVER || "minio"})`)
  );

  const shutdown = (sig) => {
    console.log(`[media] ${sig} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000).unref();
  };
  ["SIGINT", "SIGTERM"].forEach((s) => process.on(s, () => shutdown(s)));
}

main().catch((e) => {
  console.error("[media] boot failed:", e);
  process.exit(1);
});
