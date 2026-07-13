import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin's auth module pulls in jwks-rsa -> jose, which mixes
  // CJS require() with an ESM-only build of `jose`. Bundling it breaks in
  // serverless (ERR_REQUIRE_ESM); excluding it from bundling lets Node's
  // own module resolution handle it correctly at runtime instead.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
