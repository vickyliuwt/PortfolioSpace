// moderation-service/index.js
import "dotenv/config";

process.env.SERVICE_NAME = process.env.SERVICE_NAME || "moderation";

import { createApp } from "./app.js";
import { connectDb } from "./shared/db.js";

const PORT = process.env.PORT || 4005;

async function main() {
  await connectDb(process.env.MONGO_URL, "moderation");
  const app = await createApp();
  const server = app.listen(PORT, () => console.log(`[moderation] listening on :${PORT}`));

  const bye = (sig) => {
    console.log(`[moderation] ${sig} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000);
  };
  process.on("SIGINT", () => bye("SIGINT"));
  process.on("SIGTERM", () => bye("SIGTERM"));
}

main();
