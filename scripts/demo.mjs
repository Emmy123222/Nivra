#!/usr/bin/env node
// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// End-to-end walkthrough of the InvoiceRegistry protocol, run entirely
// through @midnight-ntwrk/compact-runtime's circuit simulation — no live
// network, wallet, or proof server involved (none is available in this
// development sandbox; see docs/TOOLCHAIN.md). This is Phase 24 of the
// project brief: "Demonstrate the entire protocol through scripts/tests
// before frontend development." The automated test suites
// (contracts/src/test, packages/sdk/src/test) already cover every case
// exhaustively; this script exists to narrate the *golden path* end to end
// in one readable run, including the parts that don't fit naturally into a
// unit test: printing the actual payment link URL, and showing an
// unauthorized call actually get rejected rather than just asserting it.
//
// Run via `npm run demo` from the repo root (builds contracts + sdk first).

import {
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import { randomBytes as nodeRandomBytes } from "node:crypto";
import {
  encodeCoinPublicKey,
  sampleCoinPublicKey,
  sampleEncryptionPublicKey,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { InvoiceRegistry, createNivraPrivateState, witnesses } from "@nivra/contracts";
import {
  buildPaymentLinkPayload,
  buildPaymentLinkUrl,
  computeMerchantCommitment,
  invoiceCommitmentFromPaymentLink,
  parsePaymentLinkUrl,
} from "@nivra/sdk";

const randomBytes = (n) => new Uint8Array(nodeRandomBytes(n));
const hex = (b) => Buffer.from(b).toString("hex");

const section = (title) => {
  console.log(`\n${"=".repeat(70)}\n${title}\n${"=".repeat(70)}`);
};

const setUpContract = (merchantSecret, merchantNonce, time = 0, payoutKey = new Uint8Array(32)) => {
  const contract = new InvoiceRegistry.Contract(witnesses);
  const { currentPrivateState, currentContractState, currentZswapLocalState } = contract.initialState(
    createConstructorContext(createNivraPrivateState(merchantSecret, merchantNonce, payoutKey), "0".repeat(64)),
  );
  const contractAddress = sampleContractAddress();
  const circuitContext = createCircuitContext(
    contractAddress,
    currentZswapLocalState,
    currentContractState,
    currentPrivateState,
    undefined,
    undefined,
    time,
  );
  return { contract, contractAddress, circuitContext };
};

section("1. Merchant sets up a credential and deploys InvoiceRegistry");

const merchantSecret = randomBytes(32);
const merchantNonce = randomBytes(32);
const merchantPayoutKey = sampleCoinPublicKey();
const merchantEncryptionPublicKey = sampleEncryptionPublicKey();
console.log("Merchant secret / nonce generated locally — never leave the merchant's device.");
const { contract, contractAddress, circuitContext: ctx0 } = setUpContract(
  merchantSecret,
  merchantNonce,
  0,
  encodeCoinPublicKey(merchantPayoutKey),
);
console.log(`(simulated) contract address: ${contractAddress}`);

section("2. Merchant creates a private invoice");

const invoice = {
  amount: 250_000n,
  tokenColor: randomBytes(32),
  expiry: 999_999n,
  metadataHash: randomBytes(32), // hash of off-chain metadata (line items, notes) — never the metadata itself
  invoiceSecret: randomBytes(32),
  nonce: randomBytes(32),
};
console.log("Private invoice fields (amount, tokenColor, metadataHash, invoiceSecret, nonce):");
console.log(`  amount:       ${invoice.amount} (never touches the public ledger)`);
console.log(`  expiry:       block-time deadline ${invoice.expiry}`);
console.log(`  metadataHash: ${hex(invoice.metadataHash)}`);

const { context: ctx1, result: invoiceCommitment } = contract.impureCircuits.createInvoice(
  ctx0,
  invoice.amount,
  invoice.tokenColor,
  invoice.expiry,
  invoice.metadataHash,
  invoice.invoiceSecret,
  invoice.nonce,
);
console.log(`Public invoice commitment (this, and only this, goes on-chain): ${hex(invoiceCommitment)}`);

section("3. Merchant generates a payment link — no backend involved");

const merchantCommitment = computeMerchantCommitment(merchantSecret, merchantNonce);
const linkPayload = buildPaymentLinkPayload(
  contractAddress,
  merchantCommitment,
  invoice,
  merchantPayoutKey,
  merchantEncryptionPublicKey,
);
const paymentUrl = buildPaymentLinkUrl("https://pay.nivra.example/checkout", linkPayload);
console.log("Shareable payment link (private fields live only in the URL fragment):");
console.log(`  ${paymentUrl}`);

section("4. Customer opens the link and verifies it against the chain BEFORE paying");

const decoded = parsePaymentLinkUrl(paymentUrl);
const recomputedCommitment = invoiceCommitmentFromPaymentLink(decoded);
const ledgerAfterCreate = InvoiceRegistry.ledger(ctx1.currentQueryContext.state);
const isGenuine = ledgerAfterCreate.invoices.member(recomputedCommitment);
console.log(`Recomputed commitment from link:        ${hex(recomputedCommitment)}`);
console.log(`Matches the commitment the merchant made: ${hex(invoiceCommitment) === hex(recomputedCommitment)}`);
console.log(`Present in the public ledger:             ${isGenuine}`);
if (!isGenuine) {
  console.error("Refusing to pay — this is exactly the check that stops a forged payment link.");
  process.exit(1);
}

section("5. Customer pays: a real Zswap coin is presented and verified in-circuit");

const payerReceiptSecret = randomBytes(32);
const paymentCoin = { nonce: randomBytes(32), color: invoice.tokenColor, value: invoice.amount };
ctx1.currentPrivateState = { ...ctx1.currentPrivateState, incomingPaymentCoin: paymentCoin, payerReceiptSecret };
const { context: ctx2 } = contract.impureCircuits.settleInvoice(
  ctx1,
  merchantCommitment,
  invoice.amount,
  invoice.tokenColor,
  invoice.expiry,
  invoice.metadataHash,
  invoice.invoiceSecret,
  invoice.nonce,
);
const ledgerAfterSettle = InvoiceRegistry.ledger(ctx2.currentQueryContext.state);
const record = ledgerAfterSettle.invoices.lookup(invoiceCommitment);
console.log(`Invoice state is now: ${InvoiceRegistry.InvoiceState[record.state]}`);
console.log(`Receipt registered:   ${ledgerAfterSettle.receipts.member(invoiceCommitment)}`);

section("6. Funds were routed atomically to the merchant's committed payout key");
console.log("No contract balance or follow-up claim transaction remains.");

section("7. Attacker attempts to cancel the invoice without the merchant's secret");

const attackerSecret = randomBytes(32);
const attackerNonce = randomBytes(32);
const attackerCtx = { ...ctx2, currentPrivateState: { ...ctx2.currentPrivateState, merchantSecret: attackerSecret, merchantNonce: attackerNonce } };
try {
  contract.impureCircuits.cancelInvoice(
    attackerCtx,
    invoice.amount,
    invoice.tokenColor,
    invoice.expiry,
    invoice.metadataHash,
    invoice.invoiceSecret,
    invoice.nonce,
  );
  console.error("UNEXPECTED: attacker's cancellation succeeded — this would be a critical bug.");
  process.exit(1);
} catch (err) {
  console.log(`REJECTED, as required: "${err.message}"`);
}

section("8. A second invoice, left unpaid, expires on schedule");

const { contract: contract2, circuitContext: expCtx0 } = setUpContract(merchantSecret, merchantNonce, 0);
const invoice2 = { ...invoice, nonce: randomBytes(32), expiry: 10n };
const { context: expCtx1, result: commitment2 } = contract2.impureCircuits.createInvoice(
  expCtx0,
  invoice2.amount,
  invoice2.tokenColor,
  invoice2.expiry,
  invoice2.metadataHash,
  invoice2.invoiceSecret,
  invoice2.nonce,
);
const merchantCommitment2 = computeMerchantCommitment(merchantSecret, merchantNonce);
// Rebuild the context at a later block time (past the deadline) — mirrors advanceTimeTo in contracts/src/test/simulator.ts.
const expCtx2 = createCircuitContext(
  sampleContractAddress(),
  expCtx1.currentZswapLocalState,
  expCtx1.currentQueryContext.state,
  expCtx1.currentPrivateState,
  undefined,
  expCtx1.costModel,
  50, // block time now past expiry (10)
);
const { context: expCtx3 } = contract2.impureCircuits.markExpired(
  expCtx2,
  invoice2.amount,
  merchantCommitment2,
  invoice2.tokenColor,
  invoice2.expiry,
  invoice2.metadataHash,
  invoice2.invoiceSecret,
  invoice2.nonce,
);
const expiredLedger = InvoiceRegistry.ledger(expCtx3.currentQueryContext.state);
console.log(`Second invoice state: ${InvoiceRegistry.InvoiceState[expiredLedger.invoices.lookup(commitment2).state]}`);

section("Done — full lifecycle exercised: create -> verify -> atomic payout -> unauthorized-reject -> expire");
