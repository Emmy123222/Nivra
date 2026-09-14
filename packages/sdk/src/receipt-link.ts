// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Receipt links: the payer-side counterpart to payment-link.ts. After a real
// settlement, a payer holds `invoiceCommitment` + `payerReceiptSecret` (their own
// witness value from calling `settleInvoice`) — a receipt link packages both into a
// shareable, self-verifying URL so the payer can revisit "prove I paid this" later
// (Phase 9 / Phase 15's "receipt view" screen) without this app persisting anything
// on their behalf. Same fragment-only, no-separate-authentication design as
// payment-link.ts, and for the same reason: `verifyReceipt`'s on-chain check *is*
// the authentication — see docs/PRIVACY_MODEL.md and payment-link.ts's file
// comment for the full reasoning, not repeated here.

import { bytesToHex, hexToBytes } from "./encoding.js";
import { verifyReceipt } from "./contract.js";
import type { InvoiceRegistryProviders } from "./common-types.js";

export type ReceiptLinkPayload = {
  readonly version: 1;
  readonly contractAddress: string;
  readonly invoiceCommitment: string; // hex(32 bytes)
  readonly payerReceiptSecret: string; // hex(32 bytes)
};

export const buildReceiptLinkPayload = (
  contractAddress: string,
  invoiceCommitment: Uint8Array,
  payerReceiptSecret: Uint8Array,
): ReceiptLinkPayload => ({
  version: 1,
  contractAddress,
  invoiceCommitment: bytesToHex(invoiceCommitment),
  payerReceiptSecret: bytesToHex(payerReceiptSecret),
});

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const base64UrlToBytes = (b64url: string): Uint8Array => {
  const padded = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64url.length / 4) * 4, "=");
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
};

export const encodeReceiptLinkPayload = (payload: ReceiptLinkPayload): string =>
  bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));

export const decodeReceiptLinkPayload = (token: string): ReceiptLinkPayload => {
  const parsed: unknown = JSON.parse(new TextDecoder().decode(base64UrlToBytes(token)));
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as { version?: unknown }).version !== 1 ||
    typeof (parsed as { contractAddress?: unknown }).contractAddress !== "string" ||
    typeof (parsed as { invoiceCommitment?: unknown }).invoiceCommitment !== "string" ||
    typeof (parsed as { payerReceiptSecret?: unknown }).payerReceiptSecret !== "string"
  ) {
    throw new Error("Malformed receipt link payload");
  }
  return parsed as ReceiptLinkPayload;
};

export const buildReceiptLinkUrl = (receiptBaseUrl: string, payload: ReceiptLinkPayload): string =>
  `${receiptBaseUrl}#${encodeReceiptLinkPayload(payload)}`;

export const parseReceiptLinkUrl = (url: string): ReceiptLinkPayload => {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) throw new Error("Receipt link URL has no fragment");
  return decodeReceiptLinkPayload(url.slice(hashIndex + 1));
};

/** Verifies a receipt link against the chain — the whole of the "receipt view" screen's logic in one call. */
export const verifyReceiptLink = async (
  providers: InvoiceRegistryProviders,
  payload: ReceiptLinkPayload,
): Promise<boolean> =>
  verifyReceipt(
    providers,
    payload.contractAddress,
    hexToBytes(payload.invoiceCommitment),
    hexToBytes(payload.payerReceiptSecret),
  );
