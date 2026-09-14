// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// TypeScript reimplementation of InvoiceRegistry.compact's commitment
// circuits (merchantCommitmentOf, invoiceCommitmentOf, and the coin/receipt
// commitments used by InvoiceRegistry), built from
// the *real* `@midnight-ntwrk/compact-runtime` `persistentHash` builtin
// rather than a from-scratch hash implementation. This is deliberate: it is
// the same function the compiled circuit itself calls, so there is no risk
// of this module quietly drifting from on-chain behavior through a
// hand-rolled reimplementation.
//
// Why this exists (Phase 4 / Phase 16 of the project brief): a payer opening
// a checkout page receives an invoice's private fields (amount, tokenColor,
// expiry, metadataHash, invoiceSecret, nonce, merchantCommitment) out of
// band (the payment link), not from the chain. Before trusting them enough
// to pay, the client must independently recompute the commitment and check
// it against `invoices.member(commitment)` on the public ledger. If this
// module's output ever diverged from the circuit's, that verification step
// would be worthless. `src/test/commitments.test.ts` guards against that by
// compiling the real contract and asserting byte-for-byte equality against
// its own `createInvoice` output for many cases, not just eyeballing this
// file once.

import { persistentHash, CompactTypeVector, CompactTypeBytes } from "@midnight-ntwrk/compact-runtime";
import { domainTag, uintToBytes32LE } from "./encoding.js";

const hashVector = (parts: Uint8Array[]): Uint8Array =>
  persistentHash(new CompactTypeVector(parts.length, new CompactTypeBytes(32)), parts);

/** Mirrors `merchantCommitmentOf` in invoice_registry.compact. */
export const computeMerchantCommitment = (merchantSecret: Uint8Array, merchantNonce: Uint8Array): Uint8Array =>
  hashVector([domainTag("nivra:merchant:v1"), merchantSecret, merchantNonce]);

export type InvoiceCommitmentInput = {
  merchantCommitment: Uint8Array;
  amount: bigint;
  tokenColor: Uint8Array;
  expiry: bigint;
  metadataHash: Uint8Array;
  invoiceSecret: Uint8Array;
  nonce: Uint8Array;
};

/** Mirrors `invoiceCommitmentOf` in invoice_registry.compact. */
export const computeInvoiceCommitment = (input: InvoiceCommitmentInput): Uint8Array =>
  hashVector([
    domainTag("nivra:invoice:v1"),
    input.merchantCommitment,
    uintToBytes32LE(input.amount, 8),
    input.tokenColor,
    uintToBytes32LE(input.expiry, 8),
    input.metadataHash,
    input.invoiceSecret,
    input.nonce,
  ]);

/** Mirrors the payout-key commitment stored by createInvoice. */
export const computePayoutKeyCommitment = (encodedPayoutKey: Uint8Array): Uint8Array =>
  hashVector([domainTag("nivra:payout:v1"), encodedPayoutKey]);

/** Mirrors the inline receipt commitment written by settleInvoice into the `receipts` ledger map. */
export const computeReceiptCommitment = (invoiceCommitment: Uint8Array, payerReceiptSecret: Uint8Array): Uint8Array =>
  persistentHash(new CompactTypeVector(2, new CompactTypeBytes(32)), [invoiceCommitment, payerReceiptSecret]);
