// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Tests getInvoiceStatus/verifyReceipt/verifyInvoicePaymentLink against a real
// compiled InvoiceRegistry contract (via the same in-process circuit-simulation
// pattern as commitments.test.ts), with a minimal fake `publicDataProvider` that
// hands back the simulator's real ledger state — everything downstream of that
// (the ledger decoding, commitment recomputation, receipt-hash comparison) is the
// real production code path, not a mock of it.

import { describe, expect, it } from "vitest";
import { randomBytes as nodeRandomBytes } from "node:crypto";
import {
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
  type CircuitContext,
} from "@midnight-ntwrk/compact-runtime";
import { InvoiceRegistry, createNivraPrivateState, witnesses, type NivraPrivateState } from "@nivra/contracts";
import { getInvoiceStatus, verifyReceipt } from "../contract.js";
import { buildPaymentLinkPayload, verifyInvoicePaymentLink } from "../payment-link.js";
import { computeMerchantCommitment } from "../commitments.js";
import type { InvoiceRegistryProviders } from "../common-types.js";

const randomBytes = (n: number): Uint8Array => new Uint8Array(nodeRandomBytes(n));

const setUpContract = (merchantSecret: Uint8Array, merchantNonce: Uint8Array) => {
  const contract = new InvoiceRegistry.Contract(witnesses);
  const { currentPrivateState, currentContractState, currentZswapLocalState } = contract.initialState(
    createConstructorContext(createNivraPrivateState(merchantSecret, merchantNonce), "0".repeat(64)),
  );
  const contractAddress = sampleContractAddress();
  const circuitContext = createCircuitContext(
    contractAddress,
    currentZswapLocalState,
    currentContractState,
    currentPrivateState,
    undefined,
    undefined,
    0,
  );
  return { contract, contractAddress, circuitContext };
};

/** A `publicDataProvider.queryContractState` fake backed by a real simulator's ledger state. */
const fakeProviders = (contractAddress: string, ctx: CircuitContext<NivraPrivateState>): InvoiceRegistryProviders =>
  ({
    publicDataProvider: {
      queryContractState: async (address: string) =>
        address === contractAddress ? ({ data: ctx.currentQueryContext.state } as never) : null,
    },
  }) as unknown as InvoiceRegistryProviders;

const sampleInvoice = () => ({
  amount: 12_345n,
  tokenColor: randomBytes(32),
  expiry: 999_999n,
  metadataHash: randomBytes(32),
  invoiceSecret: randomBytes(32),
  nonce: randomBytes(32),
});

describe("getInvoiceStatus", () => {
  it("returns the real on-chain state for a registered invoice", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const { contract, contractAddress, circuitContext } = setUpContract(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    const { context, result: commitment } = contract.impureCircuits.createInvoice(
      circuitContext,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );

    return getInvoiceStatus(fakeProviders(contractAddress, context), contractAddress, commitment).then((state) => {
      expect(state).toBe(InvoiceRegistry.InvoiceState.ACTIVE);
    });
  });

  it("returns null for a commitment that was never registered", async () => {
    const { contractAddress, circuitContext } = setUpContract(randomBytes(32), randomBytes(32));
    const state = await getInvoiceStatus(
      fakeProviders(contractAddress, circuitContext),
      contractAddress,
      randomBytes(32),
    );
    expect(state).toBeNull();
  });

  it("returns null when no contract is deployed at the given address", async () => {
    const { circuitContext } = setUpContract(randomBytes(32), randomBytes(32));
    const state = await getInvoiceStatus(
      fakeProviders("some-other-address", circuitContext),
      "not-the-deployed-address",
      randomBytes(32),
    );
    expect(state).toBeNull();
  });
});

describe("verifyReceipt", () => {
  it("confirms a genuine receipt for a settled invoice", async () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const { contract, contractAddress, circuitContext } = setUpContract(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    const merchantCommitment = computeMerchantCommitment(merchantSecret, merchantNonce);
    const { context: afterCreate, result: commitment } = contract.impureCircuits.createInvoice(
      circuitContext,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );

    const payerReceiptSecret = randomBytes(32);
    afterCreate.currentPrivateState = {
      ...afterCreate.currentPrivateState,
      incomingPaymentCoin: { nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount },
      payerReceiptSecret,
    };
    const { context: afterSettle } = contract.impureCircuits.settleInvoice(
      afterCreate,
      merchantCommitment,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );

    const ok = await verifyReceipt(
      fakeProviders(contractAddress, afterSettle),
      contractAddress,
      commitment,
      payerReceiptSecret,
    );
    expect(ok).toBe(true);
  });

  it("rejects a wrong receipt secret", async () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const { contract, contractAddress, circuitContext } = setUpContract(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    const merchantCommitment = computeMerchantCommitment(merchantSecret, merchantNonce);
    const { context: afterCreate, result: commitment } = contract.impureCircuits.createInvoice(
      circuitContext,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );
    afterCreate.currentPrivateState = {
      ...afterCreate.currentPrivateState,
      incomingPaymentCoin: { nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount },
      payerReceiptSecret: randomBytes(32),
    };
    const { context: afterSettle } = contract.impureCircuits.settleInvoice(
      afterCreate,
      merchantCommitment,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );

    const ok = await verifyReceipt(
      fakeProviders(contractAddress, afterSettle),
      contractAddress,
      commitment,
      randomBytes(32), // wrong secret
    );
    expect(ok).toBe(false);
  });

  it("rejects an invoice that was never paid", async () => {
    const { contract, contractAddress, circuitContext } = setUpContract(randomBytes(32), randomBytes(32));
    const inv = sampleInvoice();
    const { context, result: commitment } = contract.impureCircuits.createInvoice(
      circuitContext,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );
    const ok = await verifyReceipt(fakeProviders(contractAddress, context), contractAddress, commitment, randomBytes(32));
    expect(ok).toBe(false);
  });

  it("rejects invoice A's genuine receipt secret when presented against invoice B's commitment (no cross-invoice replay)", async () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const { contract, contractAddress, circuitContext } = setUpContract(merchantSecret, merchantNonce);
    const merchantCommitment = computeMerchantCommitment(merchantSecret, merchantNonce);

    const settle = (
      ctx: CircuitContext<NivraPrivateState>,
      receiptSecret: Uint8Array,
    ): { context: CircuitContext<NivraPrivateState>; commitment: Uint8Array } => {
      const inv = sampleInvoice();
      const { context: afterCreate, result: commitment } = contract.impureCircuits.createInvoice(
        ctx,
        inv.amount,
        inv.tokenColor,
        inv.expiry,
        inv.metadataHash,
        inv.invoiceSecret,
        inv.nonce,
      );
      afterCreate.currentPrivateState = {
        ...afterCreate.currentPrivateState,
        incomingPaymentCoin: { nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount },
        payerReceiptSecret: receiptSecret,
      };
      const { context: afterSettle } = contract.impureCircuits.settleInvoice(
        afterCreate,
        merchantCommitment,
        inv.amount,
        inv.tokenColor,
        inv.expiry,
        inv.metadataHash,
        inv.invoiceSecret,
        inv.nonce,
      );
      return { context: afterSettle, commitment };
    };

    const invoiceA = settle(circuitContext, randomBytes(32));
    const invoiceB = settle(invoiceA.context, randomBytes(32));
    const providers = fakeProviders(contractAddress, invoiceB.context);

    // Sanity: each invoice's own genuine secret verifies against its own commitment.
    expect(await verifyReceipt(providers, contractAddress, invoiceA.commitment, invoiceA.context.currentPrivateState.payerReceiptSecret)).toBe(true);
    expect(await verifyReceipt(providers, contractAddress, invoiceB.commitment, invoiceB.context.currentPrivateState.payerReceiptSecret)).toBe(true);

    // The actual replay attempt: A's real receipt secret does not stand in for B's,
    // and vice versa — the invoice commitment is baked into the receipt hash itself.
    expect(await verifyReceipt(providers, contractAddress, invoiceB.commitment, invoiceA.context.currentPrivateState.payerReceiptSecret)).toBe(false);
    expect(await verifyReceipt(providers, contractAddress, invoiceA.commitment, invoiceB.context.currentPrivateState.payerReceiptSecret)).toBe(false);
  });
});

describe("verifyInvoicePaymentLink", () => {
  it("confirms a genuine payment link against the real on-chain commitment", async () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const { contract, contractAddress, circuitContext } = setUpContract(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    const merchantCommitment = computeMerchantCommitment(merchantSecret, merchantNonce);
    const { context } = contract.impureCircuits.createInvoice(
      circuitContext,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );

    const payload = buildPaymentLinkPayload(contractAddress, merchantCommitment, inv);
    const result = await verifyInvoicePaymentLink(fakeProviders(contractAddress, context), payload);
    expect(result.onChain).toBe(true);
  });

  it("flags a link whose fields were tampered with as not on-chain", async () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const { contract, contractAddress, circuitContext } = setUpContract(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    const merchantCommitment = computeMerchantCommitment(merchantSecret, merchantNonce);
    const { context } = contract.impureCircuits.createInvoice(
      circuitContext,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );

    const payload = buildPaymentLinkPayload(contractAddress, merchantCommitment, inv);
    const tampered = { ...payload, amount: (BigInt(payload.amount) + 1n).toString() };
    const result = await verifyInvoicePaymentLink(fakeProviders(contractAddress, context), tampered);
    expect(result.onChain).toBe(false);
  });
});
