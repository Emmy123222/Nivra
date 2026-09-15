// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Payment links (Phase 20 of the project brief). A merchant's private invoice
// fields have to reach the payer somehow — Wave 1 has no backend (see
// README.md), so the entire private invoice payload travels inside the link
// itself, carried in the URL *fragment* (the part after `#`), never the
// query string or path. This is a deliberate, documented choice, not an
// oversight:
//
// - A URL fragment is never sent to any server in an HTTP request (it's a
//   client-side-only construct per the URL spec), so it cannot leak into
//   this app's own server logs, any CDN's access logs, or any proxy in
//   between — unlike a query string, which travels with every request.
// - Most browsers also strip the fragment from the `Referer` header sent to
//   a different origin, so following an outbound link from the checkout page
//   does not leak it to that third-party site either.
// - It still lands in browser history and can be shared accidentally (e.g.
//   pasted into a chat) — that risk is inherent to a bearer link and is not
//   specific to the fragment/query choice; it's the same risk a Stripe
//   Payment Link or a password-reset link carries.
//
// No separate authentication/HMAC is layered on top of the payload, and this
// is deliberate too: whoever holds the link already holds every private
// field it decodes to, so an HMAC would protect against tampering, not
// disclosure — and tampering is already caught for free. Phase 16 requires
// the checkout page to recompute the invoice commitment from these fields
// and check it against `invoices.member(commitment)` on the public ledger
// before trusting anything (see commitments.ts); changing any field changes
// the commitment, so a tampered link simply fails that check rather than
// silently succeeding with wrong data. That on-chain membership check *is*
// this payload's authentication.

import { bytesToHex, hexToBytes } from "./encoding.js";
import {
  computeInvoiceCommitment,
  computePayoutKeyCommitment,
  type InvoiceCommitmentInput,
} from "./commitments.js";
import { getInvoiceRegistryLedger } from "./contract.js";
import type { InvoiceRegistryProviders } from "./common-types.js";
import { encodeCoinPublicKey } from "@midnight-ntwrk/midnight-js-protocol/ledger";

export type PaymentLinkPayload = {
  readonly version: 1;
  /** Address of the deployed InvoiceRegistry contract to query. */
  readonly contractAddress: string;
  readonly merchantCommitment: string; // hex(32 bytes)
  readonly amount: string; // decimal string — JSON has no bigint
  readonly tokenColor: string; // hex(32 bytes)
  readonly expiry: string; // decimal string
  readonly metadataHash: string; // hex(32 bytes)
  readonly invoiceSecret: string; // hex(32 bytes)
  readonly nonce: string; // hex(32 bytes)
  /** Merchant shielded keys, revealed only inside this fragment bearer link. */
  readonly merchantPayoutKey: string;
  readonly merchantEncryptionPublicKey: string;
};

export type InvoiceForLink = Omit<InvoiceCommitmentInput, "merchantCommitment">;

/** Builds the payload a merchant's "create invoice" flow puts into a shareable link. */
export const buildPaymentLinkPayload = (
  contractAddress: string,
  merchantCommitment: Uint8Array,
  invoice: InvoiceForLink,
  merchantPayoutKey = "",
  merchantEncryptionPublicKey = "",
): PaymentLinkPayload => ({
  version: 1,
  contractAddress,
  merchantCommitment: bytesToHex(merchantCommitment),
  amount: invoice.amount.toString(),
  tokenColor: bytesToHex(invoice.tokenColor),
  expiry: invoice.expiry.toString(),
  metadataHash: bytesToHex(invoice.metadataHash),
  invoiceSecret: bytesToHex(invoice.invoiceSecret),
  nonce: bytesToHex(invoice.nonce),
  merchantPayoutKey,
  merchantEncryptionPublicKey,
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

/** Encodes a payload into the URL-fragment-safe token used by `buildPaymentLinkUrl`/`parsePaymentLinkUrl`. */
export const encodePaymentLinkPayload = (payload: PaymentLinkPayload): string =>
  bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));

/** Decodes a token produced by `encodePaymentLinkPayload`. Throws if it isn't well-formed. */
export const decodePaymentLinkPayload = (token: string): PaymentLinkPayload => {
  const parsed: unknown = JSON.parse(new TextDecoder().decode(base64UrlToBytes(token)));
  const value = parsed as Partial<Record<keyof PaymentLinkPayload, unknown>>;
  const isBytes32 = (input: unknown): input is string =>
    typeof input === "string" && /^[0-9a-fA-F]{64}$/.test(input);
  const isWalletKey = (input: unknown): input is string =>
    typeof input === "string" && input.length > 0 && input.length <= 512;
  const isUint64 = (input: unknown, positive = false): input is string => {
    if (typeof input !== "string" || !/^(0|[1-9][0-9]*)$/.test(input)) return false;
    const n = BigInt(input);
    return n <= (BigInt(2) ** BigInt(64) - BigInt(1)) && (!positive || n > BigInt(0));
  };
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    value.version !== 1 ||
    typeof value.contractAddress !== "string" || value.contractAddress.length === 0 ||
    !isBytes32(value.merchantCommitment) ||
    !isUint64(value.amount, true) ||
    !isBytes32(value.tokenColor) ||
    !isUint64(value.expiry) ||
    !isBytes32(value.metadataHash) ||
    !isBytes32(value.invoiceSecret) ||
    !isBytes32(value.nonce) ||
    // Wallet keys are connector-defined encoded strings (normally Bech32m), not
    // contract bytes32 fields. Some test/local wallets expose raw hex instead.
    !isWalletKey(value.merchantPayoutKey) ||
    !isWalletKey(value.merchantEncryptionPublicKey)
  ) {
    throw new Error("Malformed payment link payload");
  }
  return parsed as PaymentLinkPayload;
};

/** Builds a full shareable checkout URL: `${checkoutBaseUrl}#${encodedPayload}`. */
export const buildPaymentLinkUrl = (checkoutBaseUrl: string, payload: PaymentLinkPayload): string =>
  `${checkoutBaseUrl}#${encodePaymentLinkPayload(payload)}`;

/** Extracts and decodes the payload from a full checkout URL (or a bare `#fragment`). */
export const parsePaymentLinkUrl = (url: string): PaymentLinkPayload => {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) throw new Error("Payment link URL has no fragment");
  return decodePaymentLinkPayload(url.slice(hashIndex + 1));
};

/**
 * The Phase 16 checkout safety check: recomputes the invoice commitment from
 * the link's private fields and reports whether it matches what the
 * merchant's wallet actually signed off on (`merchantCommitment` is itself
 * re-derived here only when the caller has it — normally a payer does not
 * have `merchantSecret`, so they compare against the `merchantCommitment`
 * carried in the payload as-is, trusting it only once the *invoice*
 * commitment this function returns is confirmed present on-chain via
 * `invoices.member(...)`. This function does not touch the chain itself —
 * callers combine its result with a `publicDataProvider` lookup.
 */
export const invoiceCommitmentFromPaymentLink = (payload: PaymentLinkPayload): Uint8Array =>
  computeInvoiceCommitment({
    merchantCommitment: hexToBytes(payload.merchantCommitment),
    amount: BigInt(payload.amount),
    tokenColor: hexToBytes(payload.tokenColor),
    expiry: BigInt(payload.expiry),
    metadataHash: hexToBytes(payload.metadataHash),
    invoiceSecret: hexToBytes(payload.invoiceSecret),
    nonce: hexToBytes(payload.nonce),
  });

export type PaymentLinkVerification = {
  readonly commitment: Uint8Array;
  /** True only if this exact commitment is actually registered on-chain at the link's contract address. */
  readonly onChain: boolean;
};

/**
 * `verifyInvoice` from docs/WAVE1_SCOPE.md, specialized to a payment link: recomputes
 * the invoice commitment from the link's private fields (see
 * `invoiceCommitmentFromPaymentLink` above) and checks it against the public
 * ledger's `invoices` map. This is the whole of Phase 16's "client verifies invoice
 * commitment" checkout safety step in one call — a checkout page should refuse to
 * let anyone pay until `onChain` is `true`.
 */
export const verifyInvoicePaymentLink = async (
  providers: InvoiceRegistryProviders,
  payload: PaymentLinkPayload,
): Promise<PaymentLinkVerification> => {
  const commitment = invoiceCommitmentFromPaymentLink(payload);
  const ledger = await getInvoiceRegistryLedger(providers, payload.contractAddress);
  if (!ledger?.invoices.member(commitment) || !payload.merchantPayoutKey) {
    return { commitment, onChain: false };
  }
  const record = ledger.invoices.lookup(commitment);
  const expectedPayout = computePayoutKeyCommitment(encodeCoinPublicKey(payload.merchantPayoutKey));
  return {
    commitment,
    onChain: bytesToHex(record.payoutKeyCommitment) === bytesToHex(expectedPayout),
  };
};
