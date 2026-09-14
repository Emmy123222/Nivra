// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Node-only provider wiring (filesystem-based ZK config, LevelDB-based
// private state). Import from `@nivra/sdk/node`, never from `@nivra/sdk`
// itself — see the comment in index.ts for why this is a separate entry
// point rather than folded into the main barrel.

export * from "./providers.js";
