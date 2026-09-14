// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0

import { randomBytes as nodeRandomBytes } from "node:crypto";

export const randomBytes = (length: number): Uint8Array =>
  new Uint8Array(nodeRandomBytes(length));

export const bigIntTo32Bytes = (value: bigint): Uint8Array => {
  const bytes = new Uint8Array(32);
  let v = value;
  for (let i = 31; i >= 0 && v > 0n; i--) {
    bytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return bytes;
};
