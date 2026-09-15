import type { NextConfig } from "next";
import { resolve } from "node:path";

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
  webpack(config, { isServer }) {
    // Midnight's ledger/runtime packages ship real WebAssembly modules. Webpack's
    // async-WASM pipeline initializes them before client code calls encode/decode
    // helpers; this also avoids the observed Turbopack race where those helpers
    // could run before `__wbindgen_start` completed.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    if (!isServer) config.target = ["web", "es2020"];
    config.resolve.alias = {
      ...config.resolve.alias,
      "isomorphic-ws": resolve(process.cwd(), "src/lib/isomorphic-ws-shim.ts"),
    };
    return config;
  },
};

export default nextConfig;
