// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Wave 1 has no backend (see README.md) — merchant-side bookkeeping (which
// invoices this browser created, and this browser's merchant credential)
// lives in localStorage. The chain remains authoritative for lifecycle and
// settlement (docs/PROTOCOL_ARCHITECTURE.md); this store exists only so the
// dashboard can show "invoices I created" without a database, by remembering
// the private fields needed to look each one up and rebuild its payment link.
//
// Security note, stated plainly rather than glossed over: the merchant
// credential (merchantSecret/merchantNonce) is generated once per browser
// and stored here in plaintext, same tradeoff as
// `private-state-provider.ts`. Acceptable for a Wave 1 demo, not how
// production custody should work — see docs/THREAT_MODEL.md.

const CREDENTIAL_KEY = "nivra:demo-merchant-credential:v1";
const INVOICES_KEY = "nivra:demo-merchant-invoices:v1";
const CONTRACT_KEY = "nivra:demo-invoice-registry-address:v1";

export type MerchantCredential = {
  readonly merchantSecret: Uint8Array;
  readonly merchantNonce: Uint8Array;
};

const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const fromHex = (h: string) => new Uint8Array(h.match(/.{2}/g)!.map((b) => parseInt(b, 16)));

/**
 * Returns this browser's merchant credential, generating and persisting one on first use.
 * Must only be called client-side (throws server-side) — there is no meaningful "no
 * credential yet" default, unlike the read helpers below, which can safely return null/[].
 */
export const getOrCreateMerchantCredential = (): MerchantCredential => {
  if (typeof window === "undefined") {
    throw new Error("getOrCreateMerchantCredential() called outside the browser");
  }
  const raw = window.localStorage.getItem(CREDENTIAL_KEY);
  if (raw) {
    const parsed = JSON.parse(raw) as { merchantSecret: string; merchantNonce: string };
    return { merchantSecret: fromHex(parsed.merchantSecret), merchantNonce: fromHex(parsed.merchantNonce) };
  }
  const merchantSecret = crypto.getRandomValues(new Uint8Array(32));
  const merchantNonce = crypto.getRandomValues(new Uint8Array(32));
  window.localStorage.setItem(
    CREDENTIAL_KEY,
    JSON.stringify({ merchantSecret: toHex(merchantSecret), merchantNonce: toHex(merchantNonce) }),
  );
  return { merchantSecret, merchantNonce };
};

export const getStoredContractAddress = (): string | null =>
  typeof window === "undefined" ? null : window.localStorage.getItem(CONTRACT_KEY);

export const setStoredContractAddress = (address: string): void => {
  window.localStorage.setItem(CONTRACT_KEY, address);
};

export type StoredInvoice = {
  readonly commitment: string; // hex
  readonly amount: string; // decimal string
  readonly tokenColor: string; // hex
  readonly expiry: string; // decimal string
  readonly metadataHash: string; // hex
  readonly invoiceSecret: string; // hex
  readonly nonce: string; // hex
  readonly label?: string; // off-chain-only human note, never sent anywhere
  readonly createdAt: number;
};

const readAll = (): StoredInvoice[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(INVOICES_KEY);
    return raw ? (JSON.parse(raw) as StoredInvoice[]) : [];
  } catch {
    return [];
  }
};

const writeAll = (invoices: StoredInvoice[]): void => {
  window.localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
};

export const listStoredInvoices = (): StoredInvoice[] =>
  readAll().sort((a, b) => b.createdAt - a.createdAt);

export const getStoredInvoice = (commitment: string): StoredInvoice | undefined =>
  readAll().find((inv) => inv.commitment === commitment);

export const addStoredInvoice = (invoice: StoredInvoice): void => {
  writeAll([...readAll().filter((inv) => inv.commitment !== invoice.commitment), invoice]);
};
