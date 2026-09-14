// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Real, verified bundling incompatibility, not a Nivra bug: `isomorphic-ws`'s
// browser build (`browser.js`) only has a default export
// (`export default ws`, confirmed by reading it directly in node_modules).
// `@midnight-ntwrk/midnight-js-indexer-public-data-provider`'s compiled code
// does `import * as ws from 'isomorphic-ws'` and then accesses `ws.WebSocket`
// — which only exists on isomorphic-ws's *Node* build (`node.js`), not the
// browser one. Turbopack's stricter ESM named-export analysis refuses to
// build this at all ("Export WebSocket doesn't exist"); this is exactly the
// kind of thing `@originjs/vite-plugin-commonjs` papers over for Vite-based
// apps like midnightntwrk/example-bboard's bboard-ui, which depends on it.
//
// Fix: alias `isomorphic-ws` to this shim (see next.config.ts) which exposes
// the browser's native WebSocket under both names the real package's two
// builds use.
const ws = typeof WebSocket !== "undefined" ? WebSocket : undefined;
export { ws as WebSocket };
export default ws;
