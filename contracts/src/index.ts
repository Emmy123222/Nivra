// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Barrel export mirroring the pattern used by the official Midnight example
// contracts (midnightntwrk/example-counter, contract/src/index.ts): re-export
// the compiler-generated contract module under a namespace, plus the
// hand-written witnesses module, so consumers (the SDK, tests) import from a
// single stable path instead of reaching into src/managed directly.

export * as InvoiceRegistry from "./managed/invoice_registry/contract/index.js";
export * from "./witnesses.js";
