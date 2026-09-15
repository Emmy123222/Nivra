// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Deploy/join wiring for InvoiceRegistry, following the exact pattern in
// midnightntwrk/example-counter's counter-cli/src/api.ts (`deploy`,
// `joinContract`; fetched and read directly via `gh api` on 2026-09-13 — see
// docs/TOOLCHAIN.md). Once deployed or found, callers invoke circuits via the
// returned contract's `callTx.<circuitName>(...)` — e.g.
// `contract.callTx.createInvoice(amount, tokenColor, expiry, metadataHash, invoiceSecret, nonce)`
// — which is provided generically by `midnight-js-contracts`' `FoundContract`/
// `DeployedContract` types.
//
// docs/WAVE1_SCOPE.md's original SDK surface list also names `createInvoice`,
// `settleInvoice` and `cancelInvoice` as SDK-level functions. That
// list predates confirming the real midnight-js API shape; now that it's verified,
// `contract.callTx.<circuitName>(...)` already is that clean, typed, one-line
// interface, so wrapping it again in an identically-named free function would add a
// layer with no behavior of its own. `getInvoiceStatus`/`verifyInvoicePaymentLink`
// (payment-link.ts)/`verifyReceipt` below are the SDK functions that earn their
// place instead: each composes a commitment computation with a ledger query, which
// nothing else does in one call.
//
// Unlike the commitment layer (commitments.ts), this file has only been
// verified by typechecking against the real installed packages — it has
// never been run against a live proof server or network (none is available
// in this sandbox; see docs/TOOLCHAIN.md "Environment limitation: no local
// proof server"). Documented honestly in docs/BUILD_STATUS.md rather than
// claimed as working end-to-end.

import { CompiledContract } from "@midnight-ntwrk/compact-js";
import {
  deployContract,
  findDeployedContract,
  withContractScopedTransaction,
  type TransactionContext,
} from "@midnight-ntwrk/midnight-js/contracts";
import { InvoiceRegistry, witnesses, type NivraPrivateState } from "@nivra/contracts";
import { createNivraPrivateState } from "@nivra/contracts";
import {
  InvoiceRegistryPrivateStateId,
  InvoiceRegistryPayerPrivateStateId,
  type InvoiceRegistryPrivateStateIds,
  type DeployedInvoiceRegistryContract,
  type InvoiceRegistryContractType,
  type InvoiceRegistryProviders,
} from "./common-types.js";
import { computeReceiptCommitment } from "./commitments.js";
import { bytesToHex } from "./encoding.js";
import { hexToBytes } from "./encoding.js";
import type { PaymentLinkPayload } from "./payment-link.js";
import { decodeShieldedCoinPublicKey } from "./wallet.js";

/**
 * Binds the compiled InvoiceRegistry contract to its real witness
 * implementations and the location of its compiled ZK assets on disk.
 * `zkConfigPath` must point at `contracts/src/managed/invoice_registry`
 * (produced by `npm run compact --workspace=contracts`).
 */
export const compileInvoiceRegistry = (zkConfigPath: string) =>
  CompiledContract.make("nivra-invoice-registry", InvoiceRegistry.Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );

/** Deploys a fresh InvoiceRegistry instance, owned by the merchant credential encoded in `privateState`. */
export const deployInvoiceRegistry = async (
  providers: InvoiceRegistryProviders,
  zkConfigPath: string,
  privateState: NivraPrivateState,
): Promise<DeployedInvoiceRegistryContract> =>
  deployContract(providers, {
    compiledContract: compileInvoiceRegistry(zkConfigPath),
    privateStateId: InvoiceRegistryPrivateStateId,
    initialPrivateState: privateState,
  });

/** Joins an already-deployed InvoiceRegistry at `contractAddress`. */
export const joinInvoiceRegistry = async (
  providers: InvoiceRegistryProviders,
  zkConfigPath: string,
  contractAddress: string,
  privateState: NivraPrivateState,
  privateStateId: InvoiceRegistryPrivateStateIds = InvoiceRegistryPrivateStateId,
): Promise<DeployedInvoiceRegistryContract> =>
  findDeployedContract(providers, {
    contractAddress,
    compiledContract: compileInvoiceRegistry(zkConfigPath),
    privateStateId,
    initialPrivateState: privateState,
  });

/**
 * Completes checkout atomically: the wallet balances the contract-created
 * receive, and the same contract call routes that transient shielded coin to
 * the payout key committed when the merchant created the invoice.
 */
export const settleInvoiceFromPaymentLink = async (
  providers: InvoiceRegistryProviders,
  zkConfigPath: string,
  payload: PaymentLinkPayload,
  payerReceiptSecret: Uint8Array,
) => {
  if (!payload.merchantPayoutKey || !payload.merchantEncryptionPublicKey) {
    throw new Error("This is an older payment link without a merchant payout key. Ask the merchant for a new link.");
  }

  const amount = BigInt(payload.amount);
  const tokenColor = hexToBytes(payload.tokenColor);
  const privateState: NivraPrivateState = {
    ...createNivraPrivateState(
      new Uint8Array(32),
      new Uint8Array(32),
      decodeShieldedCoinPublicKey(payload.merchantPayoutKey),
    ),
    payerReceiptSecret,
    incomingPaymentCoin: {
      nonce: crypto.getRandomValues(new Uint8Array(32)),
      color: tokenColor,
      value: amount,
    },
  };
  const deployed = await joinInvoiceRegistry(
    providers,
    zkConfigPath,
    payload.contractAddress,
    privateState,
    InvoiceRegistryPayerPrivateStateId,
  );

  return withContractScopedTransaction<InvoiceRegistryContractType>(
    providers,
    async (tx) => {
      await deployed.callTx.settleInvoice(
        tx as unknown as TransactionContext<InvoiceRegistryContractType, "settleInvoice">,
        hexToBytes(payload.merchantCommitment),
        amount,
        tokenColor,
        BigInt(payload.expiry),
        hexToBytes(payload.metadataHash),
        hexToBytes(payload.invoiceSecret),
        hexToBytes(payload.nonce),
      );
    },
    {
      scopeName: "nivra-settle-invoice",
      additionalCoinEncPublicKeyMappings: new Map([
        [payload.merchantPayoutKey, payload.merchantEncryptionPublicKey],
      ]),
    },
  );
};

/** Reads the current public ledger state of a deployed InvoiceRegistry, or null if nothing is deployed there. */
export const getInvoiceRegistryLedger = async (
  providers: InvoiceRegistryProviders,
  contractAddress: string,
): Promise<InvoiceRegistry.Ledger | null> => {
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  return state ? InvoiceRegistry.ledger(state.data) : null;
};

/**
 * `getInvoiceStatus` from docs/WAVE1_SCOPE.md's SDK surface. Returns `null` when
 * either no InvoiceRegistry is deployed at `contractAddress` or no invoice with this
 * commitment has been registered there — callers should treat both as "unknown /
 * not found" rather than distinguish them, since a payer sees the same thing for a
 * malformed contract address as for a fabricated invoice commitment.
 */
export const getInvoiceStatus = async (
  providers: InvoiceRegistryProviders,
  contractAddress: string,
  invoiceCommitment: Uint8Array,
): Promise<InvoiceRegistry.InvoiceState | null> => {
  const ledger = await getInvoiceRegistryLedger(providers, contractAddress);
  if (!ledger || !ledger.invoices.member(invoiceCommitment)) return null;
  return ledger.invoices.lookup(invoiceCommitment).state;
};

/**
 * `verifyReceipt` from docs/WAVE1_SCOPE.md — proves a payer's claim "I possess a
 * legitimate receipt for a successfully settled invoice" (Phase 9 of the project
 * brief). Mirrors exactly what `settleInvoice` writes: `receipts.insert(invoiceCommitment,
 * persistentHash([invoiceCommitment, payerReceiptSecret]))`. A payer who genuinely
 * paid holds `payerReceiptSecret` locally (their own witness value from when they
 * called `settleInvoice`); anyone else does not, so this check cannot be satisfied
 * by guessing. Returns `false` for "no such invoice" and "wrong secret" alike —
 * deliberately not distinguishing them, so this can't be used to probe which
 * invoices exist.
 */
export const verifyReceipt = async (
  providers: InvoiceRegistryProviders,
  contractAddress: string,
  invoiceCommitment: Uint8Array,
  payerReceiptSecret: Uint8Array,
): Promise<boolean> => {
  const ledger = await getInvoiceRegistryLedger(providers, contractAddress);
  if (!ledger || !ledger.receipts.member(invoiceCommitment)) return false;
  const stored = ledger.receipts.lookup(invoiceCommitment);
  const recomputed = computeReceiptCommitment(invoiceCommitment, payerReceiptSecret);
  return bytesToHex(stored) === bytesToHex(recomputed);
};
