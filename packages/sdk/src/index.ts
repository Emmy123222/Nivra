// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Universal (browser- and Node-safe) exports only. Node-only provider
// wiring (NodeZkConfigProvider, levelPrivateStateProvider — both use `fs`)
// lives in `./node.ts` / the `@nivra/sdk/node` subpath instead, so that a
// browser bundler importing anything from this barrel never has to resolve
// those Node built-ins. Real, hard lesson from this session: mixing them in
// one flat barrel broke `apps/web`'s build outright (Turbopack refuses to
// resolve `fs/promises` client-side) even though the browser code never
// called the Node-only function — ES module evaluation isn't lazy per named
// export, so any import from a barrel pulls in everything the barrel's
// files import at their top level. See docs/BUILD_STATUS.md.

export * from "./commitments.js";
export * from "./types.js";
export * from "./common-types.js";
export * from "./contract.js";
export * from "./payment-link.js";
export * from "./receipt-link.js";
export * from "./wallet.js";
export { bytesToHex, hexToBytes } from "./encoding.js";
