// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Domain types for the invoice model described in docs/PRODUCT_SPEC.md and
// docs/PRIVACY_MODEL.md. These are plain data shapes with no chain
// dependency — the private invoice fields a merchant generates and shares
// with a payer out of band (over the payment link), matching exactly the
// arguments InvoiceRegistry.compact's circuits take.

/** The full private invoice representation. Never transmitted to the chain as a whole — only its commitment is. */
export type Invoice = {
  amount: bigint;
  tokenColor: Uint8Array;
  expiry: bigint;
  metadataHash: Uint8Array;
  invoiceSecret: Uint8Array;
  nonce: Uint8Array;
};

/** The merchant's private authorization material. Never transmitted anywhere; stays on the merchant's device. */
export type MerchantCredential = {
  merchantSecret: Uint8Array;
  merchantNonce: Uint8Array;
};

export { InvoiceRegistry } from "@nivra/contracts";
