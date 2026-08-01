// test-db.mjs
// tests need a mongo. downloading the ~400mb in-memory mongod is slow and its
// md5 check breaks if a download is ever cut off, so use the real mongo from
// `npm run infra:up` when it is reachable. each file gets its own throwaway
// database name and drops it afterwards, so dev data is never touched.

import mongoose from "mongoose";

const REAL_URL = process.env.MONGO_TEST_URL || "mongodb://127.0.0.1:27017";

function throwawayName() {
  return "pstest_" + Math.random().toString(36).slice(2, 10);
}

export async function startTestDb() {
  const dbName = throwawayName();

  // try the running server first
  try {
    await mongoose.connect(`${REAL_URL}/${dbName}`, { serverSelectionTimeoutMS: 1500 });
    return {
      kind: "docker",
      dbName,
      stop: async () => {
        try {
          await mongoose.connection.dropDatabase();
        } catch {
          // ignore
        }
        await mongoose.disconnect();
      },
    };
  } catch {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  }

  // nothing listening, fall back to the downloaded one
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  return {
    kind: "memory",
    dbName,
    stop: async () => {
      await mongoose.disconnect();
      await mongod.stop();
    },
  };
}
