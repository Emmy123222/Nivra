// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Byte-level encodings that mirror exactly what the Compact compiler (0.31.1)
// generates for `pad(n, "...")` and `<Uint<k>> as Field as Bytes<32>`. These
// are NOT assumed from documentation: both were verified empirically by
// compiling throwaway probe circuits and comparing their real output against
// this code, byte-for-byte, before being written here. See
// docs/TOOLCHAIN.md for the verification log. If the compiler's encoding
// ever changes, `commitments.test.ts`'s cross-check against the actual
// compiled contract will fail loudly rather than silently drifting.

/** Mirrors Compact's `pad(32, "tag")`: UTF-8 bytes, zero-padded on the right to 32 bytes. */
export const domainTag = (tag: string): Uint8Array => {
  const bytes = new TextEncoder().encode(tag);
  if (bytes.length > 32) {
    throw new Error(`Domain tag "${tag}" is ${bytes.length} bytes, exceeds the 32-byte pad target`);
  }
  const out = new Uint8Array(32);
  out.set(bytes);
  return out;
};

/**
 * Mirrors Compact's `<Uint<byteWidth*8>> as Field as Bytes<32>`: little-endian
 * bytes of `value` using exactly `byteWidth` bytes, zero-padded on the right
 * to 32 bytes. Used for `amount`/`expiry` (Uint<64>, byteWidth 8) and Zswap
 * coin `value` (Uint<128>, byteWidth 16).
 */
export const uintToBytes32LE = (value: bigint, byteWidth: 8 | 16): Uint8Array => {
  if (value < 0n) throw new Error("uintToBytes32LE: value must be non-negative");
  const out = new Uint8Array(32);
  let v = value;
  for (let i = 0; i < byteWidth; i++) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  if (v !== 0n) {
    throw new Error(`uintToBytes32LE: value does not fit in ${byteWidth} bytes`);
  }
  return out;
};

export const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

export const hexToBytes = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error(`hexToBytes: "${hex}" is not valid hex`);
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};
