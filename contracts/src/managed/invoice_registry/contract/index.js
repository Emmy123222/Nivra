import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

export var InvoiceState;
(function (InvoiceState) {
  InvoiceState[InvoiceState['ACTIVE'] = 0] = 'ACTIVE';
  InvoiceState[InvoiceState['PAID'] = 1] = 'PAID';
  InvoiceState[InvoiceState['CANCELLED'] = 2] = 'CANCELLED';
  InvoiceState[InvoiceState['EXPIRED'] = 3] = 'EXPIRED';
})(InvoiceState || (InvoiceState = {}));

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = new __compactRuntime.CompactTypeEnum(3, 1);

const _descriptor_2 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

class _InvoiceRecord_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_0.alignment())));
  }
  fromValue(value_0) {
    return {
      state: _descriptor_1.fromValue(value_0),
      merchantCommitment: _descriptor_0.fromValue(value_0),
      expiry: _descriptor_2.fromValue(value_0),
      payoutKeyCommitment: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.state).concat(_descriptor_0.toValue(value_0.merchantCommitment).concat(_descriptor_2.toValue(value_0.expiry).concat(_descriptor_0.toValue(value_0.payoutKeyCommitment))));
  }
}

const _descriptor_3 = new _InvoiceRecord_0();

const _descriptor_4 = __compactRuntime.CompactTypeBoolean;

const _descriptor_5 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ShieldedCoinInfo_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_5.alignment()));
  }
  fromValue(value_0) {
    return {
      nonce: _descriptor_0.fromValue(value_0),
      color: _descriptor_0.fromValue(value_0),
      value: _descriptor_5.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.nonce).concat(_descriptor_0.toValue(value_0.color).concat(_descriptor_5.toValue(value_0.value)));
  }
}

const _descriptor_6 = new _ShieldedCoinInfo_0();

class _ZswapCoinPublicKey_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_7 = new _ZswapCoinPublicKey_0();

class _QualifiedShieldedCoinInfo_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_5.alignment().concat(_descriptor_2.alignment())));
  }
  fromValue(value_0) {
    return {
      nonce: _descriptor_0.fromValue(value_0),
      color: _descriptor_0.fromValue(value_0),
      value: _descriptor_5.fromValue(value_0),
      mt_index: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.nonce).concat(_descriptor_0.toValue(value_0.color).concat(_descriptor_5.toValue(value_0.value).concat(_descriptor_2.toValue(value_0.mt_index))));
  }
}

const _descriptor_8 = new _QualifiedShieldedCoinInfo_0();

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_9 = new _ContractAddress_0();

class _Either_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_7.alignment().concat(_descriptor_9.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_4.fromValue(value_0),
      left: _descriptor_7.fromValue(value_0),
      right: _descriptor_9.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_left).concat(_descriptor_7.toValue(value_0.left).concat(_descriptor_9.toValue(value_0.right)));
  }
}

const _descriptor_10 = new _Either_0();

const _descriptor_11 = __compactRuntime.CompactTypeField;

const _descriptor_12 = new __compactRuntime.CompactTypeBytes(21);

class _CoinPreimage_0 {
  alignment() {
    return _descriptor_12.alignment().concat(_descriptor_6.alignment().concat(_descriptor_4.alignment().concat(_descriptor_0.alignment())));
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_12.fromValue(value_0),
      info: _descriptor_6.fromValue(value_0),
      dataType: _descriptor_4.fromValue(value_0),
      data: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_12.toValue(value_0.domain_sep).concat(_descriptor_6.toValue(value_0.info).concat(_descriptor_4.toValue(value_0.dataType).concat(_descriptor_0.toValue(value_0.data))));
  }
}

const _descriptor_13 = new _CoinPreimage_0();

const _descriptor_14 = new __compactRuntime.CompactTypeVector(8, _descriptor_0);

const _descriptor_15 = new __compactRuntime.CompactTypeVector(3, _descriptor_0);

const _descriptor_16 = new __compactRuntime.CompactTypeVector(2, _descriptor_0);

const _descriptor_17 = new __compactRuntime.CompactTypeVector(2, _descriptor_11);

class _Maybe_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_6.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_4.fromValue(value_0),
      value: _descriptor_6.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_some).concat(_descriptor_6.toValue(value_0.value));
  }
}

const _descriptor_18 = new _Maybe_0();

class _ShieldedSendResult_0 {
  alignment() {
    return _descriptor_18.alignment().concat(_descriptor_6.alignment());
  }
  fromValue(value_0) {
    return {
      change: _descriptor_18.fromValue(value_0),
      sent: _descriptor_6.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_18.toValue(value_0.change).concat(_descriptor_6.toValue(value_0.sent));
  }
}

const _descriptor_19 = new _ShieldedSendResult_0();

class _Either_1 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_4.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_20 = new _Either_1();

const _descriptor_21 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.localMerchantSecret) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named localMerchantSecret');
    }
    if (typeof(witnesses_0.localMerchantNonce) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named localMerchantNonce');
    }
    if (typeof(witnesses_0.merchantPayoutKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named merchantPayoutKey');
    }
    if (typeof(witnesses_0.incomingPaymentCoin) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named incomingPaymentCoin');
    }
    if (typeof(witnesses_0.localPayerReceiptSecret) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named localPayerReceiptSecret');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      createInvoice: (...args_1) => {
        if (args_1.length !== 7) {
          throw new __compactRuntime.CompactError(`createInvoice: expected 7 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const amount_0 = args_1[1];
        const tokenColor_0 = args_1[2];
        const expiry_0 = args_1[3];
        const metadataHash_0 = args_1[4];
        const invoiceSecret_0 = args_1[5];
        const nonce_0 = args_1[6];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('createInvoice',
                                     'argument 1 (as invoked from Typescript)',
                                     'invoice_registry.compact line 64 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('createInvoice',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'invoice_registry.compact line 64 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        if (!(tokenColor_0.buffer instanceof ArrayBuffer && tokenColor_0.BYTES_PER_ELEMENT === 1 && tokenColor_0.length === 32)) {
          __compactRuntime.typeError('createInvoice',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'invoice_registry.compact line 64 char 1',
                                     'Bytes<32>',
                                     tokenColor_0)
        }
        if (!(typeof(expiry_0) === 'bigint' && expiry_0 >= 0n && expiry_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('createInvoice',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'invoice_registry.compact line 64 char 1',
                                     'Uint<0..18446744073709551616>',
                                     expiry_0)
        }
        if (!(metadataHash_0.buffer instanceof ArrayBuffer && metadataHash_0.BYTES_PER_ELEMENT === 1 && metadataHash_0.length === 32)) {
          __compactRuntime.typeError('createInvoice',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'invoice_registry.compact line 64 char 1',
                                     'Bytes<32>',
                                     metadataHash_0)
        }
        if (!(invoiceSecret_0.buffer instanceof ArrayBuffer && invoiceSecret_0.BYTES_PER_ELEMENT === 1 && invoiceSecret_0.length === 32)) {
          __compactRuntime.typeError('createInvoice',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'invoice_registry.compact line 64 char 1',
                                     'Bytes<32>',
                                     invoiceSecret_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('createInvoice',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'invoice_registry.compact line 64 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_2.toValue(amount_0).concat(_descriptor_0.toValue(tokenColor_0).concat(_descriptor_2.toValue(expiry_0).concat(_descriptor_0.toValue(metadataHash_0).concat(_descriptor_0.toValue(invoiceSecret_0).concat(_descriptor_0.toValue(nonce_0)))))),
            alignment: _descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment())))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._createInvoice_0(context,
                                               partialProofData,
                                               amount_0,
                                               tokenColor_0,
                                               expiry_0,
                                               metadataHash_0,
                                               invoiceSecret_0,
                                               nonce_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      cancelInvoice: (...args_1) => {
        if (args_1.length !== 7) {
          throw new __compactRuntime.CompactError(`cancelInvoice: expected 7 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const amount_0 = args_1[1];
        const tokenColor_0 = args_1[2];
        const expiry_0 = args_1[3];
        const metadataHash_0 = args_1[4];
        const invoiceSecret_0 = args_1[5];
        const nonce_0 = args_1[6];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('cancelInvoice',
                                     'argument 1 (as invoked from Typescript)',
                                     'invoice_registry.compact line 91 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('cancelInvoice',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'invoice_registry.compact line 91 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        if (!(tokenColor_0.buffer instanceof ArrayBuffer && tokenColor_0.BYTES_PER_ELEMENT === 1 && tokenColor_0.length === 32)) {
          __compactRuntime.typeError('cancelInvoice',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'invoice_registry.compact line 91 char 1',
                                     'Bytes<32>',
                                     tokenColor_0)
        }
        if (!(typeof(expiry_0) === 'bigint' && expiry_0 >= 0n && expiry_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('cancelInvoice',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'invoice_registry.compact line 91 char 1',
                                     'Uint<0..18446744073709551616>',
                                     expiry_0)
        }
        if (!(metadataHash_0.buffer instanceof ArrayBuffer && metadataHash_0.BYTES_PER_ELEMENT === 1 && metadataHash_0.length === 32)) {
          __compactRuntime.typeError('cancelInvoice',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'invoice_registry.compact line 91 char 1',
                                     'Bytes<32>',
                                     metadataHash_0)
        }
        if (!(invoiceSecret_0.buffer instanceof ArrayBuffer && invoiceSecret_0.BYTES_PER_ELEMENT === 1 && invoiceSecret_0.length === 32)) {
          __compactRuntime.typeError('cancelInvoice',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'invoice_registry.compact line 91 char 1',
                                     'Bytes<32>',
                                     invoiceSecret_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('cancelInvoice',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'invoice_registry.compact line 91 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_2.toValue(amount_0).concat(_descriptor_0.toValue(tokenColor_0).concat(_descriptor_2.toValue(expiry_0).concat(_descriptor_0.toValue(metadataHash_0).concat(_descriptor_0.toValue(invoiceSecret_0).concat(_descriptor_0.toValue(nonce_0)))))),
            alignment: _descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment())))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._cancelInvoice_0(context,
                                               partialProofData,
                                               amount_0,
                                               tokenColor_0,
                                               expiry_0,
                                               metadataHash_0,
                                               invoiceSecret_0,
                                               nonce_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      settleInvoice: (...args_1) => {
        if (args_1.length !== 8) {
          throw new __compactRuntime.CompactError(`settleInvoice: expected 8 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const merchantCommitment_0 = args_1[1];
        const amount_0 = args_1[2];
        const tokenColor_0 = args_1[3];
        const expiry_0 = args_1[4];
        const metadataHash_0 = args_1[5];
        const invoiceSecret_0 = args_1[6];
        const nonce_0 = args_1[7];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('settleInvoice',
                                     'argument 1 (as invoked from Typescript)',
                                     'invoice_registry.compact line 120 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(merchantCommitment_0.buffer instanceof ArrayBuffer && merchantCommitment_0.BYTES_PER_ELEMENT === 1 && merchantCommitment_0.length === 32)) {
          __compactRuntime.typeError('settleInvoice',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'invoice_registry.compact line 120 char 1',
                                     'Bytes<32>',
                                     merchantCommitment_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('settleInvoice',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'invoice_registry.compact line 120 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        if (!(tokenColor_0.buffer instanceof ArrayBuffer && tokenColor_0.BYTES_PER_ELEMENT === 1 && tokenColor_0.length === 32)) {
          __compactRuntime.typeError('settleInvoice',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'invoice_registry.compact line 120 char 1',
                                     'Bytes<32>',
                                     tokenColor_0)
        }
        if (!(typeof(expiry_0) === 'bigint' && expiry_0 >= 0n && expiry_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('settleInvoice',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'invoice_registry.compact line 120 char 1',
                                     'Uint<0..18446744073709551616>',
                                     expiry_0)
        }
        if (!(metadataHash_0.buffer instanceof ArrayBuffer && metadataHash_0.BYTES_PER_ELEMENT === 1 && metadataHash_0.length === 32)) {
          __compactRuntime.typeError('settleInvoice',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'invoice_registry.compact line 120 char 1',
                                     'Bytes<32>',
                                     metadataHash_0)
        }
        if (!(invoiceSecret_0.buffer instanceof ArrayBuffer && invoiceSecret_0.BYTES_PER_ELEMENT === 1 && invoiceSecret_0.length === 32)) {
          __compactRuntime.typeError('settleInvoice',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'invoice_registry.compact line 120 char 1',
                                     'Bytes<32>',
                                     invoiceSecret_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('settleInvoice',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'invoice_registry.compact line 120 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(merchantCommitment_0).concat(_descriptor_2.toValue(amount_0).concat(_descriptor_0.toValue(tokenColor_0).concat(_descriptor_2.toValue(expiry_0).concat(_descriptor_0.toValue(metadataHash_0).concat(_descriptor_0.toValue(invoiceSecret_0).concat(_descriptor_0.toValue(nonce_0))))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._settleInvoice_0(context,
                                               partialProofData,
                                               merchantCommitment_0,
                                               amount_0,
                                               tokenColor_0,
                                               expiry_0,
                                               metadataHash_0,
                                               invoiceSecret_0,
                                               nonce_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      markExpired: (...args_1) => {
        if (args_1.length !== 8) {
          throw new __compactRuntime.CompactError(`markExpired: expected 8 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const amount_0 = args_1[1];
        const merchantCommitment_0 = args_1[2];
        const tokenColor_0 = args_1[3];
        const expiry_0 = args_1[4];
        const metadataHash_0 = args_1[5];
        const invoiceSecret_0 = args_1[6];
        const nonce_0 = args_1[7];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('markExpired',
                                     'argument 1 (as invoked from Typescript)',
                                     'invoice_registry.compact line 171 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('markExpired',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'invoice_registry.compact line 171 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        if (!(merchantCommitment_0.buffer instanceof ArrayBuffer && merchantCommitment_0.BYTES_PER_ELEMENT === 1 && merchantCommitment_0.length === 32)) {
          __compactRuntime.typeError('markExpired',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'invoice_registry.compact line 171 char 1',
                                     'Bytes<32>',
                                     merchantCommitment_0)
        }
        if (!(tokenColor_0.buffer instanceof ArrayBuffer && tokenColor_0.BYTES_PER_ELEMENT === 1 && tokenColor_0.length === 32)) {
          __compactRuntime.typeError('markExpired',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'invoice_registry.compact line 171 char 1',
                                     'Bytes<32>',
                                     tokenColor_0)
        }
        if (!(typeof(expiry_0) === 'bigint' && expiry_0 >= 0n && expiry_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('markExpired',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'invoice_registry.compact line 171 char 1',
                                     'Uint<0..18446744073709551616>',
                                     expiry_0)
        }
        if (!(metadataHash_0.buffer instanceof ArrayBuffer && metadataHash_0.BYTES_PER_ELEMENT === 1 && metadataHash_0.length === 32)) {
          __compactRuntime.typeError('markExpired',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'invoice_registry.compact line 171 char 1',
                                     'Bytes<32>',
                                     metadataHash_0)
        }
        if (!(invoiceSecret_0.buffer instanceof ArrayBuffer && invoiceSecret_0.BYTES_PER_ELEMENT === 1 && invoiceSecret_0.length === 32)) {
          __compactRuntime.typeError('markExpired',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'invoice_registry.compact line 171 char 1',
                                     'Bytes<32>',
                                     invoiceSecret_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('markExpired',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'invoice_registry.compact line 171 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_2.toValue(amount_0).concat(_descriptor_0.toValue(merchantCommitment_0).concat(_descriptor_0.toValue(tokenColor_0).concat(_descriptor_2.toValue(expiry_0).concat(_descriptor_0.toValue(metadataHash_0).concat(_descriptor_0.toValue(invoiceSecret_0).concat(_descriptor_0.toValue(nonce_0))))))),
            alignment: _descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._markExpired_0(context,
                                             partialProofData,
                                             amount_0,
                                             merchantCommitment_0,
                                             tokenColor_0,
                                             expiry_0,
                                             metadataHash_0,
                                             invoiceSecret_0,
                                             nonce_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      createInvoice: this.circuits.createInvoice,
      cancelInvoice: this.circuits.cancelInvoice,
      settleInvoice: this.circuits.settleInvoice,
      markExpired: this.circuits.markExpired
    };
    this.provableCircuits = {
      createInvoice: this.circuits.createInvoice,
      cancelInvoice: this.circuits.cancelInvoice,
      settleInvoice: this.circuits.settleInvoice,
      markExpired: this.circuits.markExpired
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('createInvoice', new __compactRuntime.ContractOperation());
    state_0.setOperation('cancelInvoice', new __compactRuntime.ContractOperation());
    state_0.setOperation('settleInvoice', new __compactRuntime.ContractOperation());
    state_0.setOperation('markExpired', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_21.toValue(0n),
                                                                                              alignment: _descriptor_21.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_21.toValue(1n),
                                                                                              alignment: _descriptor_21.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _some_0(value_0) { return { is_some: true, value: value_0 }; }
  _none_0() {
    return { is_some: false,
             value:
               { nonce: new Uint8Array(32), color: new Uint8Array(32), value: 0n } };
  }
  _left_0(value_0) {
    return { is_left: true, left: value_0, right: { bytes: new Uint8Array(32) } };
  }
  _right_0(value_0) {
    return { is_left: false, left: { bytes: new Uint8Array(32) }, right: value_0 };
  }
  _receiveShielded_0(context, partialProofData, coin_0) {
    const recipient_0 = this._right_0(_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                partialProofData,
                                                                                                [
                                                                                                 { dup: { n: 2 } },
                                                                                                 { idx: { cached: true,
                                                                                                          pushPath: false,
                                                                                                          path: [
                                                                                                                 { tag: 'value',
                                                                                                                   value: { value: _descriptor_21.toValue(0n),
                                                                                                                            alignment: _descriptor_21.alignment() } }] } },
                                                                                                 { popeq: { cached: true,
                                                                                                            result: undefined } }]).value));
    this._createZswapOutput_0(context, partialProofData, coin_0, recipient_0);
    const tmp_0 = this._coinCommitment_0(coin_0, recipient_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_21.toValue(1n),
                                                                  alignment: _descriptor_21.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    return [];
  }
  _sendShielded_0(context, partialProofData, input_0, recipient_0, value_0) {
    const selfAddr_0 = _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                 partialProofData,
                                                                                 [
                                                                                  { dup: { n: 2 } },
                                                                                  { idx: { cached: true,
                                                                                           pushPath: false,
                                                                                           path: [
                                                                                                  { tag: 'value',
                                                                                                    value: { value: _descriptor_21.toValue(0n),
                                                                                                             alignment: _descriptor_21.alignment() } }] } },
                                                                                  { popeq: { cached: true,
                                                                                             result: undefined } }]).value);
    this._createZswapInput_0(context, partialProofData, input_0);
    const tmp_0 = this._coinNullifier_0(this._downcastQualifiedCoin_0(input_0),
                                        selfAddr_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_21.toValue(0n),
                                                                  alignment: _descriptor_21.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    let t_0;
    const change_0 = (t_0 = input_0.value,
                      (__compactRuntime.assert(t_0 >= value_0,
                                               'result of subtraction would be negative'),
                       t_0 - value_0));
    const output_0 = { nonce:
                         this._upgradeFromTransient_0(this._transientHash_0([__compactRuntime.convertBytesToField(28,
                                                                                                                  new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 107, 101, 114, 110, 101, 108, 58, 110, 111, 110, 99, 101, 95, 101, 118, 111, 108, 118, 101]),
                                                                                                                  '<standard library>'),
                                                                             this._degradeToTransient_0(input_0.nonce)])),
                       color: input_0.color,
                       value: value_0 };
    this._createZswapOutput_0(context, partialProofData, output_0, recipient_0);
    const tmp_1 = this._coinCommitment_0(output_0, recipient_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_21.toValue(2n),
                                                                  alignment: _descriptor_21.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    if (!recipient_0.is_left
        &&
        this._equal_0(recipient_0.right.bytes, selfAddr_0.bytes))
    {
      const tmp_2 = this._coinCommitment_0(output_0, recipient_0);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_21.toValue(1n),
                                                                    alignment: _descriptor_21.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_2),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
    }
    if (this._equal_1(change_0, 0n)) {
      return { change: this._none_0(), sent: output_0 };
    } else {
      const changeCoin_0 = { nonce:
                               this._upgradeFromTransient_0(this._transientHash_0([__compactRuntime.convertBytesToField(30,
                                                                                                                        new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 107, 101, 114, 110, 101, 108, 58, 110, 111, 110, 99, 101, 95, 101, 118, 111, 108, 118, 101, 47, 50]),
                                                                                                                        '<standard library>'),
                                                                                   this._degradeToTransient_0(input_0.nonce)])),
                             color: input_0.color,
                             value: change_0 };
      this._createZswapOutput_0(context,
                                partialProofData,
                                changeCoin_0,
                                this._right_0(selfAddr_0));
      const cm_0 = this._coinCommitment_0(changeCoin_0,
                                          this._right_0(selfAddr_0));
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_21.toValue(2n),
                                                                    alignment: _descriptor_21.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cm_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_21.toValue(1n),
                                                                    alignment: _descriptor_21.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cm_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
      return { change: this._some_0(changeCoin_0), sent: output_0 };
    }
  }
  _downcastQualifiedCoin_0(coin_0) {
    return { nonce: coin_0.nonce, color: coin_0.color, value: coin_0.value };
  }
  _coinCommitment_0(coin_0, recipient_0) {
    return this._persistentHash_2({ domain_sep:
                                      new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 122, 115, 119, 97, 112, 45, 99, 99, 91, 118, 49, 93]),
                                    info: coin_0,
                                    dataType: recipient_0.is_left,
                                    data:
                                      recipient_0.is_left ?
                                      recipient_0.left.bytes :
                                      recipient_0.right.bytes });
  }
  _coinNullifier_0(coin_0, addr_0) {
    return this._persistentHash_2({ domain_sep:
                                      new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 122, 115, 119, 97, 112, 45, 99, 110, 91, 118, 49, 93]),
                                    info: coin_0,
                                    dataType: false,
                                    data: addr_0.bytes });
  }
  _blockTimeLt_0(context, partialProofData, time_0) {
    return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 2 } },
                                                                      { idx: { cached: true,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_21.toValue(2n),
                                                                                                 alignment: _descriptor_21.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(time_0),
                                                                                                                             alignment: _descriptor_2.alignment() }).encode() } },
                                                                      'lt',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value);
  }
  _blockTimeGte_0(context, partialProofData, time_0) {
    return !this._blockTimeLt_0(context, partialProofData, time_0);
  }
  _transientHash_0(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_17, value_0);
    return result_0;
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_15, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_16, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_13, value_0);
    return result_0;
  }
  _persistentHash_3(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_14, value_0);
    return result_0;
  }
  _degradeToTransient_0(x_0) {
    const result_0 = __compactRuntime.degradeToTransient(x_0);
    return result_0;
  }
  _upgradeFromTransient_0(x_0) {
    const result_0 = __compactRuntime.upgradeFromTransient(x_0);
    return result_0;
  }
  _createZswapInput_0(context, partialProofData, coin_0) {
    const result_0 = __compactRuntime.createZswapInput(context, coin_0);
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  _createZswapOutput_0(context, partialProofData, coin_0, recipient_0) {
    const result_0 = __compactRuntime.createZswapOutput(context,
                                                        coin_0,
                                                        recipient_0);
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  _merchantCommitmentOf_0(merchantSecret_0, merchantNonce_0) {
    return this._persistentHash_0([new Uint8Array([110, 105, 118, 114, 97, 58, 109, 101, 114, 99, 104, 97, 110, 116, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   merchantSecret_0,
                                   merchantNonce_0]);
  }
  _invoiceCommitmentOf_0(merchantCommitment_0,
                         amount_0,
                         tokenColor_0,
                         expiry_0,
                         metadataHash_0,
                         invoiceSecret_0,
                         nonce_0)
  {
    return this._persistentHash_3([new Uint8Array([110, 105, 118, 114, 97, 58, 105, 110, 118, 111, 105, 99, 101, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   merchantCommitment_0,
                                   __compactRuntime.convertFieldToBytes(32,
                                                                        amount_0,
                                                                        'invoice_registry.compact line 51 char 5'),
                                   tokenColor_0,
                                   __compactRuntime.convertFieldToBytes(32,
                                                                        expiry_0,
                                                                        'invoice_registry.compact line 53 char 5'),
                                   metadataHash_0,
                                   invoiceSecret_0,
                                   nonce_0]);
  }
  _localMerchantSecret_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.localMerchantSecret(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('localMerchantSecret',
                                 'return value',
                                 'invoice_registry.compact line 60 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _localMerchantNonce_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.localMerchantNonce(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('localMerchantNonce',
                                 'return value',
                                 'invoice_registry.compact line 61 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _merchantPayoutKey_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.merchantPayoutKey(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.bytes.buffer instanceof ArrayBuffer && result_0.bytes.BYTES_PER_ELEMENT === 1 && result_0.bytes.length === 32)) {
      __compactRuntime.typeError('merchantPayoutKey',
                                 'return value',
                                 'invoice_registry.compact line 62 char 1',
                                 'struct ZswapCoinPublicKey<bytes: Bytes<32>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_7.toValue(result_0),
      alignment: _descriptor_7.alignment()
    });
    return result_0;
  }
  _createInvoice_0(context,
                   partialProofData,
                   amount_0,
                   tokenColor_0,
                   expiry_0,
                   metadataHash_0,
                   invoiceSecret_0,
                   nonce_0)
  {
    __compactRuntime.assert(amount_0 > 0n, 'Amount must be positive');
    const merchantCommitment_0 = this._merchantCommitmentOf_0(this._localMerchantSecret_0(context,
                                                                                          partialProofData),
                                                              this._localMerchantNonce_0(context,
                                                                                         partialProofData));
    const payoutKeyCommitment_0 = this._persistentHash_1([new Uint8Array([110, 105, 118, 114, 97, 58, 112, 97, 121, 111, 117, 116, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                          this._merchantPayoutKey_0(context,
                                                                                    partialProofData).bytes]);
    const commitment_0 = this._invoiceCommitmentOf_0(merchantCommitment_0,
                                                     amount_0,
                                                     tokenColor_0,
                                                     expiry_0,
                                                     metadataHash_0,
                                                     invoiceSecret_0,
                                                     nonce_0);
    __compactRuntime.assert(!_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_21.toValue(0n),
                                                                                                                   alignment: _descriptor_21.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'Invoice with this commitment already exists');
    const tmp_0 = { state: 0,
                    merchantCommitment: merchantCommitment_0,
                    expiry: expiry_0,
                    payoutKeyCommitment: payoutKeyCommitment_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_21.toValue(0n),
                                                                  alignment: _descriptor_21.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return commitment_0;
  }
  _cancelInvoice_0(context,
                   partialProofData,
                   amount_0,
                   tokenColor_0,
                   expiry_0,
                   metadataHash_0,
                   invoiceSecret_0,
                   nonce_0)
  {
    const merchantCommitment_0 = this._merchantCommitmentOf_0(this._localMerchantSecret_0(context,
                                                                                          partialProofData),
                                                              this._localMerchantNonce_0(context,
                                                                                         partialProofData));
    const commitment_0 = this._invoiceCommitmentOf_0(merchantCommitment_0,
                                                     amount_0,
                                                     tokenColor_0,
                                                     expiry_0,
                                                     metadataHash_0,
                                                     invoiceSecret_0,
                                                     nonce_0);
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_21.toValue(0n),
                                                                                                                  alignment: _descriptor_21.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No such invoice');
    const record_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_21.toValue(0n),
                                                                                                           alignment: _descriptor_21.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(commitment_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    __compactRuntime.assert(record_0.state === 0, 'Invoice is not active');
    __compactRuntime.assert(this._equal_2(record_0.merchantCommitment,
                                          merchantCommitment_0),
                            'Not the authorized merchant');
    const tmp_0 = { state: 2,
                    merchantCommitment: record_0.merchantCommitment,
                    expiry: record_0.expiry,
                    payoutKeyCommitment: record_0.payoutKeyCommitment };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_21.toValue(0n),
                                                                  alignment: _descriptor_21.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _incomingPaymentCoin_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.incomingPaymentCoin(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.nonce.buffer instanceof ArrayBuffer && result_0.nonce.BYTES_PER_ELEMENT === 1 && result_0.nonce.length === 32 && result_0.color.buffer instanceof ArrayBuffer && result_0.color.BYTES_PER_ELEMENT === 1 && result_0.color.length === 32 && typeof(result_0.value) === 'bigint' && result_0.value >= 0n && result_0.value <= 340282366920938463463374607431768211455n)) {
      __compactRuntime.typeError('incomingPaymentCoin',
                                 'return value',
                                 'invoice_registry.compact line 115 char 1',
                                 'struct ShieldedCoinInfo<nonce: Bytes<32>, color: Bytes<32>, value: Uint<0..340282366920938463463374607431768211456>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_6.toValue(result_0),
      alignment: _descriptor_6.alignment()
    });
    return result_0;
  }
  _localPayerReceiptSecret_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.localPayerReceiptSecret(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('localPayerReceiptSecret',
                                 'return value',
                                 'invoice_registry.compact line 116 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _settleInvoice_0(context,
                   partialProofData,
                   merchantCommitment_0,
                   amount_0,
                   tokenColor_0,
                   expiry_0,
                   metadataHash_0,
                   invoiceSecret_0,
                   nonce_0)
  {
    const commitment_0 = this._invoiceCommitmentOf_0(merchantCommitment_0,
                                                     amount_0,
                                                     tokenColor_0,
                                                     expiry_0,
                                                     metadataHash_0,
                                                     invoiceSecret_0,
                                                     nonce_0);
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_21.toValue(0n),
                                                                                                                  alignment: _descriptor_21.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No such invoice');
    const record_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_21.toValue(0n),
                                                                                                           alignment: _descriptor_21.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(commitment_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    __compactRuntime.assert(record_0.state === 0, 'Invoice is not active');
    __compactRuntime.assert(this._equal_3(record_0.merchantCommitment,
                                          merchantCommitment_0),
                            'Merchant commitment does not match invoice');
    __compactRuntime.assert(this._equal_4(record_0.expiry, expiry_0),
                            'Expiry does not match invoice');
    __compactRuntime.assert(this._blockTimeLt_0(context,
                                                partialProofData,
                                                record_0.expiry),
                            'Invoice has expired');
    const coin_0 = this._incomingPaymentCoin_0(context, partialProofData);
    __compactRuntime.assert(this._equal_5(coin_0.color, tokenColor_0),
                            'Wrong token for this invoice');
    __compactRuntime.assert(this._equal_6(coin_0.value, amount_0),
                            'Coin value does not match invoice amount');
    this._receiveShielded_0(context, partialProofData, coin_0);
    const payoutKey_0 = this._merchantPayoutKey_0(context, partialProofData);
    const suppliedPayoutKeyCommitment_0 = this._persistentHash_1([new Uint8Array([110, 105, 118, 114, 97, 58, 112, 97, 121, 111, 117, 116, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                                  payoutKey_0.bytes]);
    __compactRuntime.assert(this._equal_7(suppliedPayoutKeyCommitment_0,
                                          record_0.payoutKeyCommitment),
                            'Payout key does not match this invoice');
    const transientCoin_0 = { nonce: coin_0.nonce,
                              color: coin_0.color,
                              value: coin_0.value,
                              mt_index: 0n };
    this._sendShielded_0(context,
                         partialProofData,
                         transientCoin_0,
                         this._left_0(payoutKey_0),
                         amount_0);
    const tmp_0 = { state: 1,
                    merchantCommitment: record_0.merchantCommitment,
                    expiry: record_0.expiry,
                    payoutKeyCommitment: record_0.payoutKeyCommitment };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_21.toValue(0n),
                                                                  alignment: _descriptor_21.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = this._persistentHash_1([commitment_0,
                                          this._localPayerReceiptSecret_0(context,
                                                                          partialProofData)]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_21.toValue(1n),
                                                                  alignment: _descriptor_21.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _markExpired_0(context,
                 partialProofData,
                 amount_0,
                 merchantCommitment_0,
                 tokenColor_0,
                 expiry_0,
                 metadataHash_0,
                 invoiceSecret_0,
                 nonce_0)
  {
    const commitment_0 = this._invoiceCommitmentOf_0(merchantCommitment_0,
                                                     amount_0,
                                                     tokenColor_0,
                                                     expiry_0,
                                                     metadataHash_0,
                                                     invoiceSecret_0,
                                                     nonce_0);
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_21.toValue(0n),
                                                                                                                  alignment: _descriptor_21.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No such invoice');
    const record_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_21.toValue(0n),
                                                                                                           alignment: _descriptor_21.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(commitment_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    __compactRuntime.assert(record_0.state === 0, 'Invoice is not active');
    __compactRuntime.assert(this._equal_8(record_0.merchantCommitment,
                                          merchantCommitment_0),
                            'Merchant commitment does not match invoice');
    __compactRuntime.assert(this._equal_9(record_0.expiry, expiry_0),
                            'Expiry does not match invoice');
    __compactRuntime.assert(this._blockTimeGte_0(context,
                                                 partialProofData,
                                                 record_0.expiry),
                            'Invoice has not expired yet');
    const tmp_0 = { state: 3,
                    merchantCommitment: record_0.merchantCommitment,
                    expiry: record_0.expiry,
                    payoutKeyCommitment: record_0.payoutKeyCommitment };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_21.toValue(0n),
                                                                  alignment: _descriptor_21.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_4(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_6(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_8(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_9(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    invoices: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_21.toValue(0n),
                                                                                                     alignment: _descriptor_21.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_21.toValue(0n),
                                                                                                     alignment: _descriptor_21.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'invoice_registry.compact line 31 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_21.toValue(0n),
                                                                                                     alignment: _descriptor_21.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'invoice_registry.compact line 31 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_21.toValue(0n),
                                                                                                     alignment: _descriptor_21.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_3.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    receipts: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_21.toValue(1n),
                                                                                                     alignment: _descriptor_21.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_21.toValue(1n),
                                                                                                     alignment: _descriptor_21.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'invoice_registry.compact line 118 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_21.toValue(1n),
                                                                                                     alignment: _descriptor_21.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'invoice_registry.compact line 118 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_21.toValue(1n),
                                                                                                     alignment: _descriptor_21.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[1];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_0.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  localMerchantSecret: (...args) => undefined,
  localMerchantNonce: (...args) => undefined,
  merchantPayoutKey: (...args) => undefined,
  incomingPaymentCoin: (...args) => undefined,
  localPayerReceiptSecret: (...args) => undefined
});
export const pureCircuits = {};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
