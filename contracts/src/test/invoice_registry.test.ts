// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, beforeEach } from "vitest";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { InvoiceRegistrySimulator } from "./simulator.js";
import { randomBytes } from "./utils.js";
import { InvoiceState } from "../managed/invoice_registry/contract/index.js";

setNetworkId("undeployed");

const sampleInvoice = () => ({
  amount: 1_000n,
  tokenColor: randomBytes(32),
  expiry: 4_102_444_800n, // far future (2100-01-01), so ACTIVE by default in tests that don't test expiry
  metadataHash: randomBytes(32),
  invoiceSecret: randomBytes(32),
  nonce: randomBytes(32),
});

describe("InvoiceRegistry — CREATE", () => {
  it("registers a new invoice as ACTIVE with the correct merchant commitment", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const sim = new InvoiceRegistrySimulator(merchantSecret, merchantNonce);
    const inv = sampleInvoice();

    const commitment = sim.createInvoice(
      inv.amount,
      inv.tokenColor,
      inv.expiry,
      inv.metadataHash,
      inv.invoiceSecret,
      inv.nonce,
    );

    const record = sim.getLedger().invoices.lookup(commitment);
    expect(record.state).toEqual(InvoiceState.ACTIVE);
    expect(record.expiry).toEqual(inv.expiry);
  });

  it("rejects creating a duplicate invoice (identical preimage)", () => {
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32));
    const inv = sampleInvoice();
    sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    expect(() =>
      sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Invoice with this commitment already exists");
  });

  it("gives two invoices with different nonces different commitments even with identical business terms", () => {
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32));
    const inv = sampleInvoice();
    const c1 = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, randomBytes(32));
    const c2 = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, randomBytes(32));
    expect(c1).not.toEqual(c2);
  });

  it("rejects a zero-amount invoice", () => {
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32));
    const inv = sampleInvoice();
    expect(() =>
      sim.createInvoice(0n, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Amount must be positive");
  });
});

describe("InvoiceRegistry — AUTHORIZATION / CANCEL", () => {
  it("lets the authorized merchant cancel an active invoice", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const sim = new InvoiceRegistrySimulator(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);

    sim.cancelInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);

    expect(sim.getLedger().invoices.lookup(commitment).state).toEqual(InvoiceState.CANCELLED);
  });

  it("rejects cancellation by an attacker without the merchant's secret", () => {
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32));
    const inv = sampleInvoice();
    sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);

    // Attacker: same commitment, but doesn't know the real merchant secret.
    sim.switchMerchant(randomBytes(32), randomBytes(32));

    expect(() =>
      sim.cancelInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("No such invoice");
    // Note: because merchantCommitment is folded into the invoice commitment itself,
    // an attacker with the wrong secret doesn't even recompute a matching commitment —
    // they fail the *existence* check, never reaching the authorization check. This is
    // a stronger guarantee than "authorization check fails": the wrong secret can't
    // even address someone else's invoice.
  });

  it("does not let a cancelled invoice be cancelled again", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const sim = new InvoiceRegistrySimulator(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    sim.cancelInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);

    expect(() =>
      sim.cancelInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Invoice is not active");
  });
});

describe("InvoiceRegistry — SETTLEMENT", () => {
  it("pays an active invoice via a real receiveShielded call and writes a receipt commitment", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const sim = new InvoiceRegistrySimulator(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;

    sim.setIncomingPaymentCoin(
      { nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount },
      randomBytes(32),
    );
    sim.settleInvoice(merchantCommitment, inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);

    const ledger = sim.getLedger();
    expect(ledger.invoices.lookup(commitment).state).toEqual(InvoiceState.PAID);
    expect(ledger.invoices.lookup(commitment).claimed).toBe(true);
    expect(ledger.receipts.member(commitment)).toBe(true);
  });

  it("rejects settlement when the offered coin's value does not match the invoice amount", () => {
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32));
    const inv = sampleInvoice();
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;

    sim.setIncomingPaymentCoin(
      { nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount - 1n },
      randomBytes(32),
    );
    expect(() =>
      sim.settleInvoice(merchantCommitment, inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Coin value does not match invoice amount");
  });

  it("rejects a second settlement attempt against an already-PAID invoice (double payment)", () => {
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32));
    const inv = sampleInvoice();
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;

    sim.setIncomingPaymentCoin({ nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount }, randomBytes(32));
    sim.settleInvoice(merchantCommitment, inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);

    sim.setIncomingPaymentCoin({ nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount }, randomBytes(32));
    expect(() =>
      sim.settleInvoice(merchantCommitment, inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Invoice is not active");
  });

  it("rejects settlement of a cancelled invoice", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const sim = new InvoiceRegistrySimulator(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;
    sim.cancelInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);

    sim.setIncomingPaymentCoin({ nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount }, randomBytes(32));
    expect(() =>
      sim.settleInvoice(merchantCommitment, inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Invoice is not active");
  });

  it("rejects settlement against a nonexistent invoice commitment", () => {
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32));
    const inv = sampleInvoice();
    sim.setIncomingPaymentCoin({ nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount }, randomBytes(32));
    expect(() =>
      sim.settleInvoice(randomBytes(32), inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("No such invoice");
  });

  it("rejects a checkout link that redirects the committed payout key", () => {
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32));
    const inv = sampleInvoice();
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;
    sim.setIncomingPaymentCoin({ nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount }, randomBytes(32));
    sim.setHeldCoin(
      { nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount, mt_index: 0n },
      randomBytes(32),
    );

    expect(() =>
      sim.settleInvoice(merchantCommitment, inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Payout key does not match this invoice");
  });
});

describe("InvoiceRegistry — ATOMIC PAYOUT", () => {
  const settle = (
    sim: InvoiceRegistrySimulator,
    merchantCommitment: Uint8Array,
    inv: ReturnType<typeof sampleInvoice>,
    coinNonce: Uint8Array,
  ) => {
    sim.setIncomingPaymentCoin({ nonce: coinNonce, color: inv.tokenColor, value: inv.amount }, randomBytes(32));
    sim.settleInvoice(merchantCommitment, inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
  };

  it("marks the shielded settlement claimed in the payment transaction", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const sim = new InvoiceRegistrySimulator(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;
    const coinNonce = randomBytes(32);
    settle(sim, merchantCommitment, inv, coinNonce);

    expect(sim.getLedger().invoices.lookup(commitment).claimed).toBe(true);
  });

  it("rejects a separate claim because atomic settlement already paid out", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const sim = new InvoiceRegistrySimulator(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;
    const coinNonce = randomBytes(32);
    settle(sim, merchantCommitment, inv, coinNonce);
    sim.setHeldCoin({ nonce: coinNonce, color: inv.tokenColor, value: inv.amount, mt_index: 0n }, randomBytes(32));
    expect(() =>
      sim.claimSettlement(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Settlement for this invoice has already been claimed");
  });

  it("rejects claiming by someone without the merchant's secret", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const sim = new InvoiceRegistrySimulator(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;
    const coinNonce = randomBytes(32);
    settle(sim, merchantCommitment, inv, coinNonce);

    sim.switchMerchant(randomBytes(32), randomBytes(32));
    sim.setHeldCoin({ nonce: coinNonce, color: inv.tokenColor, value: inv.amount, mt_index: 0n }, randomBytes(32));
    expect(() =>
      sim.claimSettlement(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("No such invoice");
  });

  it("rejects claiming an invoice that hasn't been paid yet", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const sim = new InvoiceRegistrySimulator(merchantSecret, merchantNonce);
    const inv = sampleInvoice();
    sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);

    sim.setHeldCoin({ nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount, mt_index: 0n }, randomBytes(32));
    expect(() =>
      sim.claimSettlement(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Invoice is not paid");
  });
});

describe("InvoiceRegistry — EXPIRY", () => {
  it("rejects settlement after the invoice's deadline has passed", () => {
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32), 0);
    const inv = { ...sampleInvoice(), expiry: 1_000n };
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;

    sim.advanceTimeTo(2_000);
    sim.setIncomingPaymentCoin({ nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount }, randomBytes(32));
    expect(() =>
      sim.settleInvoice(merchantCommitment, inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Invoice has expired");
  });

  it("allows settlement before the deadline", () => {
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32), 0);
    const inv = { ...sampleInvoice(), expiry: 2_000n };
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;

    sim.advanceTimeTo(1_000);
    sim.setIncomingPaymentCoin({ nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount }, randomBytes(32));
    sim.settleInvoice(merchantCommitment, inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);

    expect(sim.getLedger().invoices.lookup(commitment).state).toEqual(InvoiceState.PAID);
  });

  it("does not allow markExpired before the deadline", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const sim = new InvoiceRegistrySimulator(merchantSecret, merchantNonce, 0);
    const inv = { ...sampleInvoice(), expiry: 2_000n };
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;

    sim.advanceTimeTo(1_000);
    expect(() =>
      sim.markExpired(inv.amount, merchantCommitment, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Invoice has not expired yet");
  });

  it("lets anyone (permissionless) mark an invoice EXPIRED once its deadline has passed", () => {
    const merchantSecret = randomBytes(32);
    const merchantNonce = randomBytes(32);
    const sim = new InvoiceRegistrySimulator(merchantSecret, merchantNonce, 0);
    const inv = { ...sampleInvoice(), expiry: 1_000n };
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;

    sim.advanceTimeTo(2_000);
    // A stranger, not the merchant, triggers the cleanup — this is fine by design.
    sim.switchMerchant(randomBytes(32), randomBytes(32));
    sim.markExpired(inv.amount, merchantCommitment, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);

    expect(sim.getLedger().invoices.lookup(commitment).state).toEqual(InvoiceState.EXPIRED);
  });

  it("at the exact deadline instant, treats the invoice as expired, not payable (no off-by-one gap)", () => {
    // The boundary matters: if blockTimeLt/blockTimeGte were off by one relative to
    // each other, there could be an instant where settlement AND markExpired both
    // succeed (a real double-spend-shaped race) or neither does (a stuck invoice).
    // Verified here rather than assumed from the primitive names.
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32), 0);
    const inv = { ...sampleInvoice(), expiry: 1_000n };
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;

    sim.advanceTimeTo(1_000); // exactly == expiry
    sim.setIncomingPaymentCoin({ nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount }, randomBytes(32));
    expect(() =>
      sim.settleInvoice(merchantCommitment, inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Invoice has expired");

    sim.markExpired(inv.amount, merchantCommitment, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    expect(sim.getLedger().invoices.lookup(commitment).state).toEqual(InvoiceState.EXPIRED);
  });

  it("never lets an EXPIRED invoice be settled", () => {
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32), 0);
    const inv = { ...sampleInvoice(), expiry: 1_000n };
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const merchantCommitment = sim.getLedger().invoices.lookup(commitment).merchantCommitment;

    sim.advanceTimeTo(2_000);
    sim.markExpired(inv.amount, merchantCommitment, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);

    sim.setIncomingPaymentCoin({ nonce: randomBytes(32), color: inv.tokenColor, value: inv.amount }, randomBytes(32));
    expect(() =>
      sim.settleInvoice(merchantCommitment, inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce),
    ).toThrow("Invoice is not active");
  });
});

describe("InvoiceRegistry — PRIVACY", () => {
  it("never stores amount, tokenColor, metadataHash, invoiceSecret, or nonce in public ledger state", () => {
    const sim = new InvoiceRegistrySimulator(randomBytes(32), randomBytes(32));
    const inv = sampleInvoice();
    const commitment = sim.createInvoice(inv.amount, inv.tokenColor, inv.expiry, inv.metadataHash, inv.invoiceSecret, inv.nonce);
    const record = sim.getLedger().invoices.lookup(commitment);
    // The ledger record's own schema stores only commitments and lifecycle data.
    // is the real enforcement here — this assertion documents that guarantee in a way
    // that fails loudly if the schema is ever widened to leak more.
    expect(Object.keys(record).sort()).toEqual([
      "claimed",
      "expiry",
      "merchantCommitment",
      "paidCoinCommitment",
      "payoutKeyCommitment",
      "state",
    ]);
    // Both *Commitment fields are hashes rather than the coin or payout key.
  });
});
