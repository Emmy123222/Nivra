// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { randomBytes as nodeRandomBytes } from "node:crypto";
import {
  buildPaymentLinkPayload,
  buildPaymentLinkUrl,
  decodePaymentLinkPayload,
  invoiceCommitmentFromPaymentLink,
  parsePaymentLinkUrl,
} from "../payment-link.js";
import { computeInvoiceCommitment, computeMerchantCommitment } from "../commitments.js";
import { bytesToHex } from "../encoding.js";

const randomBytes = (length: number): Uint8Array => new Uint8Array(nodeRandomBytes(length));

const sampleInvoiceForLink = () => ({
  amount: 42_000n,
  tokenColor: randomBytes(32),
  expiry: 1_800_000_000n,
  metadataHash: randomBytes(32),
  invoiceSecret: randomBytes(32),
  nonce: randomBytes(32),
});
const payoutKey = "11".repeat(32);
const encryptionKey = "22".repeat(32);

describe("payment links", () => {
  it("round-trips a payload through a full URL", () => {
    const merchantCommitment = computeMerchantCommitment(randomBytes(32), randomBytes(32));
    const invoice = sampleInvoiceForLink();
    const payload = buildPaymentLinkPayload("0xcontractAddress", merchantCommitment, invoice, payoutKey, encryptionKey);

    const url = buildPaymentLinkUrl("https://pay.nivra.example/checkout", payload);
    expect(url.startsWith("https://pay.nivra.example/checkout#")).toBe(true);

    const decoded = parsePaymentLinkUrl(url);
    expect(decoded).toEqual(payload);
  });

  it("survives decoding from just the fragment token, not only a full URL", () => {
    const merchantCommitment = computeMerchantCommitment(randomBytes(32), randomBytes(32));
    const payload = buildPaymentLinkPayload("0xaddr", merchantCommitment, sampleInvoiceForLink(), payoutKey, encryptionKey);
    const url = buildPaymentLinkUrl("https://pay.example/c", payload);
    const token = url.split("#")[1];
    expect(decodePaymentLinkPayload(token)).toEqual(payload);
  });

  it("the recomputed invoice commitment matches what the SDK's own commitment function produces for the same fields", () => {
    const merchantCommitment = computeMerchantCommitment(randomBytes(32), randomBytes(32));
    const invoice = sampleInvoiceForLink();
    const payload = buildPaymentLinkPayload("0xaddr", merchantCommitment, invoice, payoutKey, encryptionKey);

    const fromLink = invoiceCommitmentFromPaymentLink(payload);
    const direct = computeInvoiceCommitment({ merchantCommitment, ...invoice });
    expect(Buffer.from(fromLink)).toEqual(Buffer.from(direct));
  });

  it("a tampered payload produces a different commitment (the on-chain membership check would reject it)", () => {
    const merchantCommitment = computeMerchantCommitment(randomBytes(32), randomBytes(32));
    const invoice = sampleInvoiceForLink();
    const payload = buildPaymentLinkPayload("0xaddr", merchantCommitment, invoice, payoutKey, encryptionKey);
    const genuineCommitment = invoiceCommitmentFromPaymentLink(payload);

    const tampered = { ...payload, amount: (BigInt(payload.amount) + 1n).toString() };
    const tamperedCommitment = invoiceCommitmentFromPaymentLink(tampered);

    expect(bytesToHex(tamperedCommitment)).not.toEqual(bytesToHex(genuineCommitment));
  });

  it("rejects a malformed token rather than silently returning partial data", () => {
    expect(() => decodePaymentLinkPayload("not-valid-base64url-json!!!")).toThrow();
  });

  it("rejects a URL with no fragment", () => {
    expect(() => parsePaymentLinkUrl("https://pay.example/checkout")).toThrow("no fragment");
  });
});
