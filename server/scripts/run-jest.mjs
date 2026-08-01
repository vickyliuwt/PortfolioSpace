// run-jest.mjs
// jest needs a node flag for esm, and npm workspaces hoist jest up to
// server/node_modules, so a plain relative path does not resolve.
//
// two traps here. jest ships an "exports" map that allows "jest/bin/jest"
// but NOT "jest/bin/jest.js", and the copy may be hoisted or nested.
// so try the exported name, then the legacy path, then just look on disk.

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const from = pathToFileURL(path.join(process.cwd(), "package.json"));
const require = createRequire(from);

const tried = [];

function viaResolve(spec) {
  tried.push(`resolve ${spec}`);
  try {
    return require.resolve(spec);
  } catch {
    return null;
  }
}

// walk up looking for the file itself, ignores any exports map
function viaDisk() {
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    const guess = path.join(dir, "node_modules", "jest", "bin", "jest.js");
    tried.push(`file ${guess}`);
    if (fs.existsSync(guess)) return guess;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

const jestBin = viaResolve("jest/bin/jest") || viaResolve("jest/bin/jest.js") || viaDisk();

if (!jestBin) {
  console.error("could not find jest. run: npm --prefix server install");
  console.error("looked for:");
  for (const t of tried) console.error("   " + t);
  process.exit(1);
}

const args = ["--experimental-vm-modules", jestBin, ...process.argv.slice(2)];
const child = spawn(process.execPath, args, { stdio: "inherit" });
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
