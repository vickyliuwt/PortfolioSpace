// search-service/index.js
import "dotenv/config";

process.env.SERVICE_NAME = process.env.SERVICE_NAME || "search";
import { createApp } from "./app.js";
import { connectDb } from "./shared/db.js";
import { ensureIndexes, ping } from "./es.js";
import { reindexAll } from "./indexer.js";

const PORT = process.env.PORT || 4004;

async function main() {
  await connectDb(process.env.MONGO_URL, "search");

  const app = await createApp();

  // warm index
  const es = await ping();
  if (es.up) {
    console.log(`   elasticsearch ${es.version} connected`);
    try {
      await ensureIndexes();
      const counts = await reindexAll();
      console.log(`   indexed ${counts.projects} projects, ${counts.messages} messages`);
    } catch (e) {
      console.error("   index warmup failed:", e.message);
    }
  } else {
    console.log("   elasticsearch not reachable, search falls back to mongo");
  }

  const server = app.listen(PORT, () => console.log(`[search] listening on :${PORT}`));

  const bye = (sig) => {
    console.log(`[search] ${sig} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000);
  };
  process.on("SIGINT", () => bye("SIGINT"));
  process.on("SIGTERM", () => bye("SIGTERM"));
}

main();
