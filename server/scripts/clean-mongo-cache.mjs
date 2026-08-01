// clean-mongo-cache.mjs
// the test mongod binary is cached in your home folder. if a download gets
// cut off you are left with a part file and a stale lock, and every test
// then dies with an md5 mismatch. this wipes it so the next run re-downloads.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dirs = [
  path.join(os.homedir(), ".cache", "mongodb-binaries"),
  path.join(os.homedir(), ".mongodb-binaries"),
];

let removed = 0;
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir);
  console.log(`removing ${dir} (${files.length} item(s))`);
  fs.rmSync(dir, { recursive: true, force: true });
  removed += 1;
}

if (removed === 0) {
  console.log("nothing cached, so nothing to clean");
  console.log("looked in:");
  for (const d of dirs) console.log("   " + d);
} else {
  console.log("done. the next test run downloads a fresh binary, give it a few minutes");
}
