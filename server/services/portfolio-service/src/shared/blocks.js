// shared/blocks.js
// the blocks rows live in auth-service, this just reads them

import mongoose from "mongoose";

// either direction counts
export async function blockedBetween(a, b) {
  if (!a || !b || a === b) return false;
  const row = await mongoose.connection.collection("blocks").findOne({
    $or: [
      { blocker: a, blocked: b },
      { blocker: b, blocked: a },
    ],
  });
  return !!row;
}
