// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { randomBytes as nodeRandomBytes } from "node:crypto";
import {
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import { InvoiceRegistry, createNivraPrivateState, witnesses } from "@nivra/contracts";
import { computeMerchantCommitment } from "../commitments.js";
import {
  buildReceiptLinkPayload,
  buildReceiptLinkUrl,
  decodeReceiptLinkPayload,
  parseReceiptLinkUrl,
  verifyReceiptLink,
} from "../receipt-link.js";
import type { InvoiceRegistryProviders } from "../common-types.js";

const randomBytes = (n: number): Uint8Array => new Uint8Array(nodeRandomBytes(n));

describe("receipt links", () => {
  it("round-trips a payload through a full URL", () => {
    const payload = buildReceiptLinkPayload("0xaddr", randomBytes(32), randomBytes(32));
    const url = buildReceiptLinkUrl("https://pay.nivra.example/receipt", payload);
    expect(url.startsWith("https://pay.nivra.example/receipt#")).toBe(true);
    expect(parseReceiptLinkUrl(url)).toEqual(payload);
  });

  it("rejects a malformed token", () => {
    expect(() => decodeReceiptLinkPayload("not-valid!!!")).toThrow();
  });

  it("rejects receipt JSON with incorrectly sized commitment fields", () => {
    const token = Buffer.from(JSON.stringify({
      version: 1,
      contractAddress: "0xaddr",
      invoiceCommitment: "ab",
      payerReceiptSecret: "22".repeat(32),
    })).toString("base64url");
    expect(() => decodeReceiptLinkPayload(token)).toThrow("Malformed receipt link payload");
  });

  it("verifies a genuine receipt end to end against a real settled invoice", async () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const contract = new InvoiceRegistry.Contract(witnesses);
    const { currentPrivateState, currentContractState, currentZswapLocalState } = contract.initialState(
      createConstructorContext(createNivraPrivateState(merchantSecret, merchantNonce), "0".repeat(64)),
    );
    const contractAddress = sampleContractAddress();
    const ctx0 = createCircuitContext(
      contractAddress,
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
      undefined,
      undefined,
      0,
    );

    const inv = {
      amount: 500n,
      tokenColor: randomBytes(32),
      expiry: 999_999n,
      metadataHash: randomBytes(32),
      invoiceSecret: randomBytes(32),
      nonce: randomBytes(32),
    };
    const { context: ctx1, result: invoiceCommitment } = contract.impureCircuits.createInvoice(
      ctx0,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );

    const payerReceiptSecret = randomBytes(32);
    ctx1.currentPrivateState = {
      ...ctx1.currentPrivateState,
      incomingPaymentCoin: { nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount },
      payerReceiptSecret,
    };
    const merchantCommitment = computeMerchantCommitment(merchantSecret, merchantNonce);
    const { context: ctx2 } = contract.impureCircuits.settleInvoice(
      ctx1,
      merchantCommitment,
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );

    const providers = {
      publicDataProvider: {
        queryContractState: async (address: string) =>
          address === contractAddress ? ({ data: ctx2.currentQueryContext.state } as never) : null,
      },
    } as unknown as InvoiceRegistryProviders;

    const payload = buildReceiptLinkPayload(contractAddress, invoiceCommitment, payerReceiptSecret);
    expect(await verifyReceiptLink(providers, payload)).toBe(true);

    const forged = buildReceiptLinkPayload(contractAddress, invoiceCommitment, randomBytes(32));
    expect(await verifyReceiptLink(providers, forged)).toBe(false);
  });
});
