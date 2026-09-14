// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Cross-checks this package's TS-side commitment functions against the
// actual compiled InvoiceRegistry contract's own output, using the real
// contract exactly as any consumer of @nivra/contracts would. This is the
// test that matters most in this file: if the compiler ever changes how
// `pad`, numeric casts, or `persistentHash` encode values, this fails,
// rather than checkout verification (Phase 16) silently trusting a
// commitment that no longer matches on-chain reality.

import { describe, expect, it } from "vitest";
import { randomBytes as nodeRandomBytes } from "node:crypto";
import {
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import { InvoiceRegistry, createNivraPrivateState, witnesses } from "@nivra/contracts";
import { computeInvoiceCommitment, computeMerchantCommitment, computePayoutKeyCommitment } from "../commitments.js";

const randomBytes = (length: number): Uint8Array => new Uint8Array(nodeRandomBytes(length));

/** Minimal one-shot setup mirroring contracts/src/test/simulator.ts, kept local so this
 * package's tests exercise @nivra/contracts only through its published surface. */
const setUpContract = (merchantSecret: Uint8Array, merchantNonce: Uint8Array) => {
  const contract = new InvoiceRegistry.Contract(witnesses);
  const { currentPrivateState, currentContractState, currentZswapLocalState } = contract.initialState(
    createConstructorContext(createNivraPrivateState(merchantSecret, merchantNonce), "0".repeat(64)),
  );
  const circuitContext = createCircuitContext(
    sampleContractAddress(),
    currentZswapLocalState,
    currentContractState,
    currentPrivateState,
    undefined,
    undefined,
    0,
  );
  return { contract, circuitContext };
};

const sampleInvoice = () => ({
  amount: 12_345n,
  tokenColor: randomBytes(32),
  expiry: 999_999n,
  metadataHash: randomBytes(32),
  invoiceSecret: randomBytes(32),
  nonce: randomBytes(32),
});

describe("SDK commitments — cross-checked against the real compiled contract", () => {
  it("computeMerchantCommitment matches the value the contract itself uses to authorize", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const { contract, circuitContext } = setUpContract(merchantSecret, merchantNonce);
    const inv = sampleInvoice();

    const { context } = contract.impureCircuits.createInvoice(
      circuitContext,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );
    const record = InvoiceRegistry.ledger(context.currentQueryContext.state).invoices;
    const sdkMerchantCommitment = computeMerchantCommitment(merchantSecret, merchantNonce);
    const [, storedRecord] = [...record][0];
    expect(Buffer.from(storedRecord.merchantCommitment)).toEqual(Buffer.from(sdkMerchantCommitment));
  });

  it("computeInvoiceCommitment matches the exact commitment key the contract inserted", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const { contract, circuitContext } = setUpContract(merchantSecret, merchantNonce);
    const inv = sampleInvoice();

    const { result: chainCommitment } = contract.impureCircuits.createInvoice(
      circuitContext,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );

    const merchantCommitment = computeMerchantCommitment(merchantSecret, merchantNonce);
    const sdkCommitment = computeInvoiceCommitment({ merchantCommitment, ...inv });

    expect(Buffer.from(chainCommitment)).toEqual(Buffer.from(sdkCommitment));
  });

  it("computePayoutKeyCommitment matches the key commitment stored by createInvoice", () => {
    const { contract, circuitContext } = setUpContract(randomBytes(32), randomBytes(32));
    const inv = sampleInvoice();
    const { context } = contract.impureCircuits.createInvoice(
      circuitContext,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );
    const [, record] = [...InvoiceRegistry.ledger(context.currentQueryContext.state).invoices][0];
    expect(Buffer.from(record.payoutKeyCommitment)).toEqual(Buffer.from(computePayoutKeyCommitment(new Uint8Array(32))));
  });

  it("produces different commitments for different nonces (no accidental collisions)", () => {
    const merchantCommitment = randomBytes(32);
    const base = { merchantCommitment, amount: 100n, tokenColor: randomBytes(32), expiry: 1n, metadataHash: randomBytes(32), invoiceSecret: randomBytes(32) };
    const a = computeInvoiceCommitment({ ...base, nonce: randomBytes(32) });
    const b = computeInvoiceCommitment({ ...base, nonce: randomBytes(32) });
    expect(Buffer.from(a)).not.toEqual(Buffer.from(b));
  });

  it("is deterministic: identical inputs produce identical commitments", () => {
    const merchantCommitment = randomBytes(32);
    const input = {
      merchantCommitment,
      amount: 500n,
      tokenColor: randomBytes(32),
      expiry: 42n,
      metadataHash: randomBytes(32),
      invoiceSecret: randomBytes(32),
      nonce: randomBytes(32),
    };
    expect(Buffer.from(computeInvoiceCommitment(input))).toEqual(Buffer.from(computeInvoiceCommitment(input)));
  });
});
