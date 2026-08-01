// shared/db.js
// mongo connect (mongoose)

import mongoose from "mongoose";

export async function connectDb(url, label = "service") {
  const uri = url || "mongodb://127.0.0.1:27017/portfoliospace";

  try {
    await mongoose.connect(uri);
    console.log(`[${label}] mongo connected`);
  } catch (err) {
    console.error(`[${label}] mongo failed:`, err.message);
    process.exit(1);
  }

  // dev query log
  if (process.env.NODE_ENV === "development") {
    mongoose.set("debug", (coll, method) => {
      console.log(`   db ${coll}.${method}`);
    });
  }

  return mongoose;
}
