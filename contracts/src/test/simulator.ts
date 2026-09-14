// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Test harness modeled directly on the official pattern used in
// midnightntwrk/example-bboard's BBoardSimulator (verified by fetching that
// repo's source), adapted to InvoiceRegistry's circuits and private state.

import {
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../managed/invoice_registry/contract/index.js";
import {
  type NivraPrivateState,
  createNivraPrivateState,
  witnesses,
  type ShieldedCoin,
  type QualifiedShieldedCoin,
} from "../witnesses.js";

export class InvoiceRegistrySimulator {
  readonly contract: Contract<NivraPrivateState>;
  readonly contractAddress = sampleContractAddress();
  circuitContext: CircuitContext<NivraPrivateState>;

  constructor(merchantSecret: Uint8Array, merchantNonce: Uint8Array, time = 0) {
    this.contract = new Contract<NivraPrivateState>(witnesses);
    const { currentPrivateState, currentContractState, currentZswapLocalState } =
      this.contract.initialState(
        createConstructorContext(
          createNivraPrivateState(merchantSecret, merchantNonce),
          "0".repeat(64),
        ),
      );
    this.circuitContext = createCircuitContext(
      this.contractAddress,
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
      undefined,
      undefined,
      time,
    );
  }

  /** Rebuilds the circuit context at a different simulated block time, preserving all state. */
  public advanceTimeTo(time: number) {
    this.circuitContext = createCircuitContext(
      this.contractAddress,
      this.circuitContext.currentZswapLocalState,
      this.circuitContext.currentQueryContext.state,
      this.circuitContext.currentPrivateState,
      undefined,
      this.circuitContext.costModel,
      time,
    );
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): NivraPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public switchMerchant(merchantSecret: Uint8Array, merchantNonce: Uint8Array) {
    this.circuitContext.currentPrivateState = {
      ...this.circuitContext.currentPrivateState,
      merchantSecret,
      merchantNonce,
    };
  }

  public setIncomingPaymentCoin(coin: ShieldedCoin, payerReceiptSecret: Uint8Array) {
    this.circuitContext.currentPrivateState = {
      ...this.circuitContext.currentPrivateState,
      incomingPaymentCoin: coin,
      payerReceiptSecret,
    };
  }

  public setHeldCoin(coin: QualifiedShieldedCoin, merchantPayoutKey: Uint8Array) {
    this.circuitContext.currentPrivateState = {
      ...this.circuitContext.currentPrivateState,
      heldCoin: coin,
      merchantPayoutKey,
    };
  }

  public createInvoice(
    amount: bigint,
    tokenColor: Uint8Array,
    expiry: bigint,
    metadataHash: Uint8Array,
    invoiceSecret: Uint8Array,
    nonce: Uint8Array,
  ): Uint8Array {
    const { context, result } = this.contract.impureCircuits.createInvoice(
      this.circuitContext,
      amount,
      tokenColor,
      expiry,
      metadataHash,
      invoiceSecret,
      nonce,
    );
    this.circuitContext = context;
    return result;
  }

  public cancelInvoice(
    amount: bigint,
    tokenColor: Uint8Array,
    expiry: bigint,
    metadataHash: Uint8Array,
    invoiceSecret: Uint8Array,
    nonce: Uint8Array,
  ): Ledger {
    this.circuitContext = this.contract.impureCircuits.cancelInvoice(
      this.circuitContext,
      amount,
      tokenColor,
      expiry,
      metadataHash,
      invoiceSecret,
      nonce,
    ).context;
    return this.getLedger();
  }

  public markExpired(
    amount: bigint,
    merchantCommitment: Uint8Array,
    tokenColor: Uint8Array,
    expiry: bigint,
    metadataHash: Uint8Array,
    invoiceSecret: Uint8Array,
    nonce: Uint8Array,
  ): Ledger {
    this.circuitContext = this.contract.impureCircuits.markExpired(
      this.circuitContext,
      amount,
      merchantCommitment,
      tokenColor,
      expiry,
      metadataHash,
      invoiceSecret,
      nonce,
    ).context;
    return this.getLedger();
  }

  public settleInvoice(
    merchantCommitment: Uint8Array,
    amount: bigint,
    tokenColor: Uint8Array,
    expiry: bigint,
    metadataHash: Uint8Array,
    invoiceSecret: Uint8Array,
    nonce: Uint8Array,
  ): Ledger {
    this.circuitContext = this.contract.impureCircuits.settleInvoice(
      this.circuitContext,
      merchantCommitment,
      amount,
      tokenColor,
      expiry,
      metadataHash,
      invoiceSecret,
      nonce,
    ).context;
    return this.getLedger();
  }

  public claimSettlement(
    amount: bigint,
    tokenColor: Uint8Array,
    expiry: bigint,
    metadataHash: Uint8Array,
    invoiceSecret: Uint8Array,
    nonce: Uint8Array,
  ): Ledger {
    this.circuitContext = this.contract.impureCircuits.claimSettlement(
      this.circuitContext,
      amount,
      tokenColor,
      expiry,
      metadataHash,
      invoiceSecret,
      nonce,
    ).context;
    return this.getLedger();
  }
}
