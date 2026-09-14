#!/usr/bin/env node
// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Copies the compiled InvoiceRegistry ZK assets (proving/verifier keys, zkIR)
// into public/, where the browser-side FetchZkConfigProvider expects to find
// them via HTTP: `${baseURL}/keys/<circuit>.prover`, `.verifier`, and
// `${baseURL}/zkir/<circuit>.bzkir` — this exact layout was confirmed by
// reading @midnight-ntwrk/midnight-js-fetch-zk-config-provider's compiled
// source directly, not assumed. Run automatically before `dev`/`build` (see
// package.json `predev`/`prebuild`). Not committed — public/keys and
// public/zkir are gitignored, same as contracts/src/managed/.

import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const managedDir = join(here, "..", "..", "..", "contracts", "src", "managed", "invoice_registry");
const keysSrc = join(managedDir, "keys");
const zkirSrc = join(managedDir, "zkir");

if (!existsSync(keysSrc) || !existsSync(zkirSrc)) {
  console.error(
    `Compiled contract assets not found at ${managedDir}.\n` +
      "Run `npm run compact --workspace=contracts` first (see contracts/package.json).",
  );
  process.exit(1);
}

const keysDest = join(here, "..", "public", "keys");
const zkirDest = join(here, "..", "public", "zkir");
mkdirSync(keysDest, { recursive: true });
mkdirSync(zkirDest, { recursive: true });

cpSync(keysSrc, keysDest, { recursive: true });
for (const file of readdirSync(zkirSrc)) {
  if (file.endsWith(".bzkir")) cpSync(join(zkirSrc, file), join(zkirDest, file));
}

console.log(`Copied ZK assets: ${keysSrc} -> ${keysDest}, ${zkirSrc}/*.bzkir -> ${zkirDest}`);
