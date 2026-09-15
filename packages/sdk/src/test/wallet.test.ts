import { describe, expect, it } from "vitest";
import { bech32m } from "@scure/base";
import { decodeShieldedCoinPublicKey } from "../wallet.js";

describe("decodeShieldedCoinPublicKey", () => {
  const bytes = Uint8Array.from({ length: 32 }, (_, index) => index + 1);

  it("decodes a DApp Connector v4 Bech32m coin public key", () => {
    const key = bech32m.encode("mn_shield-cpk_preprod", bech32m.toWords(bytes), false);
    expect(decodeShieldedCoinPublicKey(key)).toEqual(bytes);
  });

  it("keeps compatibility with raw hex keys", () => {
    const key = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    expect(decodeShieldedCoinPublicKey(key)).toEqual(bytes);
    expect(decodeShieldedCoinPublicKey(`0x${key}`)).toEqual(bytes);
  });

  it("reports a clear error for a different Bech32m key type", () => {
    const key = bech32m.encode("mn_shield-epk_preprod", bech32m.toWords(bytes), false);
    expect(() => decodeShieldedCoinPublicKey(key)).toThrow(/expected mn_shield-cpk/);
  });
});
