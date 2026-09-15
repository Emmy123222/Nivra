import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum InvoiceState { ACTIVE = 0, PAID = 1, CANCELLED = 2, EXPIRED = 3 }

export type InvoiceRecord = { state: InvoiceState;
                              merchantCommitment: Uint8Array;
                              expiry: bigint;
                              payoutKeyCommitment: Uint8Array
                            };

export type Witnesses<PS> = {
  localMerchantSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  localMerchantNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  merchantPayoutKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { bytes: Uint8Array
                                                                                }];
  incomingPaymentCoin(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { nonce: Uint8Array,
                                                                                    color: Uint8Array,
                                                                                    value: bigint
                                                                                  }];
  localPayerReceiptSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  createInvoice(context: __compactRuntime.CircuitContext<PS>,
                amount_0: bigint,
                tokenColor_0: Uint8Array,
                expiry_0: bigint,
                metadataHash_0: Uint8Array,
                invoiceSecret_0: Uint8Array,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  cancelInvoice(context: __compactRuntime.CircuitContext<PS>,
                amount_0: bigint,
                tokenColor_0: Uint8Array,
                expiry_0: bigint,
                metadataHash_0: Uint8Array,
                invoiceSecret_0: Uint8Array,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  settleInvoice(context: __compactRuntime.CircuitContext<PS>,
                merchantCommitment_0: Uint8Array,
                amount_0: bigint,
                tokenColor_0: Uint8Array,
                expiry_0: bigint,
                metadataHash_0: Uint8Array,
                invoiceSecret_0: Uint8Array,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  markExpired(context: __compactRuntime.CircuitContext<PS>,
              amount_0: bigint,
              merchantCommitment_0: Uint8Array,
              tokenColor_0: Uint8Array,
              expiry_0: bigint,
              metadataHash_0: Uint8Array,
              invoiceSecret_0: Uint8Array,
              nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  createInvoice(context: __compactRuntime.CircuitContext<PS>,
                amount_0: bigint,
                tokenColor_0: Uint8Array,
                expiry_0: bigint,
                metadataHash_0: Uint8Array,
                invoiceSecret_0: Uint8Array,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  cancelInvoice(context: __compactRuntime.CircuitContext<PS>,
                amount_0: bigint,
                tokenColor_0: Uint8Array,
                expiry_0: bigint,
                metadataHash_0: Uint8Array,
                invoiceSecret_0: Uint8Array,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  settleInvoice(context: __compactRuntime.CircuitContext<PS>,
                merchantCommitment_0: Uint8Array,
                amount_0: bigint,
                tokenColor_0: Uint8Array,
                expiry_0: bigint,
                metadataHash_0: Uint8Array,
                invoiceSecret_0: Uint8Array,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  markExpired(context: __compactRuntime.CircuitContext<PS>,
              amount_0: bigint,
              merchantCommitment_0: Uint8Array,
              tokenColor_0: Uint8Array,
              expiry_0: bigint,
              metadataHash_0: Uint8Array,
              invoiceSecret_0: Uint8Array,
              nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  createInvoice(context: __compactRuntime.CircuitContext<PS>,
                amount_0: bigint,
                tokenColor_0: Uint8Array,
                expiry_0: bigint,
                metadataHash_0: Uint8Array,
                invoiceSecret_0: Uint8Array,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  cancelInvoice(context: __compactRuntime.CircuitContext<PS>,
                amount_0: bigint,
                tokenColor_0: Uint8Array,
                expiry_0: bigint,
                metadataHash_0: Uint8Array,
                invoiceSecret_0: Uint8Array,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  settleInvoice(context: __compactRuntime.CircuitContext<PS>,
                merchantCommitment_0: Uint8Array,
                amount_0: bigint,
                tokenColor_0: Uint8Array,
                expiry_0: bigint,
                metadataHash_0: Uint8Array,
                invoiceSecret_0: Uint8Array,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  markExpired(context: __compactRuntime.CircuitContext<PS>,
              amount_0: bigint,
              merchantCommitment_0: Uint8Array,
              tokenColor_0: Uint8Array,
              expiry_0: bigint,
              metadataHash_0: Uint8Array,
              invoiceSecret_0: Uint8Array,
              nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  invoices: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): InvoiceRecord;
    [Symbol.iterator](): Iterator<[Uint8Array, InvoiceRecord]>
  };
  receipts: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
