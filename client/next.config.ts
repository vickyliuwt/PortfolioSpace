import type { NextConfig } from "next";
import path from "path";

// works whether this file loads as esm or cjs
const here = typeof __dirname !== "undefined" ? __dirname : process.cwd();

// standalone = smaller docker image
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // root + client both have a lockfile, so point turbopack at this folder
  turbopack: {
    root: path.resolve(here),
  },
  images: {
    // allow minio + s3 hosts for <Image> (we mostly use plain <img> though)
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

export default nextConfig;
