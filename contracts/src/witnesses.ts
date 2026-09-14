// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Defines Nivra's private state shape and the witness functions that expose
// it to the compiled InvoiceRegistry contract, per the WitnessContext pattern
// documented for @midnight-ntwrk/compact-runtime 0.16.0 (verified against the
// installed package's type declarations, not assumed).

import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger } from "./managed/invoice_registry/contract/index.js";

export type ShieldedCoin = {
  nonce: Uint8Array;
  color: Uint8Array;
  value: bigint;
};

export type NivraPrivateState = {
  readonly merchantSecret: Uint8Array;
  readonly merchantNonce: Uint8Array;
  readonly payerReceiptSecret: Uint8Array;
  readonly incomingPaymentCoin: ShieldedCoin | undefined;
  readonly merchantPayoutKey: Uint8Array | undefined;
};

export const createNivraPrivateState = (
  merchantSecret: Uint8Array,
  merchantNonce: Uint8Array,
  merchantPayoutKey?: Uint8Array,
): NivraPrivateState => ({
  merchantSecret,
  merchantNonce,
  payerReceiptSecret: new Uint8Array(32),
  incomingPaymentCoin: undefined,
  // A zero key keeps pure simulator/commitment tests deterministic; browser
  // merchant and checkout flows always pass the wallet's encoded real key.
  merchantPayoutKey: merchantPayoutKey ?? new Uint8Array(32),
});

const notConfigured = (witnessName: string) => (): never => {
  throw new Error(
    `${witnessName} witness was called without test/runtime state being configured first. ` +
      "This is a real, informative failure, not a bug to silence: it means the caller " +
      "tried to exercise a settlement circuit path that needs a real coin " +
      "or key supplied first.",
  );
};

export const witnesses = {
  localMerchantSecret: ({
    privateState,
  }: WitnessContext<Ledger, NivraPrivateState>): [NivraPrivateState, Uint8Array] => [
    privateState,
    privateState.merchantSecret,
  ],

  localMerchantNonce: ({
    privateState,
  }: WitnessContext<Ledger, NivraPrivateState>): [NivraPrivateState, Uint8Array] => [
    privateState,
    privateState.merchantNonce,
  ],

  localPayerReceiptSecret: ({
    privateState,
  }: WitnessContext<Ledger, NivraPrivateState>): [NivraPrivateState, Uint8Array] => [
    privateState,
    privateState.payerReceiptSecret,
  ],

  incomingPaymentCoin: ({
    privateState,
  }: WitnessContext<Ledger, NivraPrivateState>): [NivraPrivateState, ShieldedCoin] => {
    if (!privateState.incomingPaymentCoin) return notConfigured("incomingPaymentCoin")();
    return [privateState, privateState.incomingPaymentCoin];
  },

  merchantPayoutKey: ({
    privateState,
  }: WitnessContext<Ledger, NivraPrivateState>): [NivraPrivateState, { bytes: Uint8Array }] => {
    if (!privateState.merchantPayoutKey) return notConfigured("merchantPayoutKey")();
    return [privateState, { bytes: privateState.merchantPayoutKey }];
  },
};
