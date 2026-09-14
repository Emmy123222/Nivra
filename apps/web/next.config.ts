import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // See src/lib/isomorphic-ws-shim.ts for why this is needed: a real
      // bundling incompatibility between @midnight-ntwrk/midnight-js-indexer-public-data-provider
      // and isomorphic-ws's browser build, not a Nivra bug. Path is relative
      // to this config file (an absolute path was rejected by Turbopack:
      // "server relative imports are not implemented yet").
      "isomorphic-ws": "./src/lib/isomorphic-ws-shim.ts",
    },
  },
};

export default nextConfig;
