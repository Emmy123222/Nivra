// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// `connectWallet` from docs/WAVE1_SCOPE.md's SDK surface. Detects and connects to a
// Midnight DApp Connector-compatible wallet injected at `window.midnight`. The
// detection/connect sequence (poll for `window.midnight`, filter by semver-compatible
// `apiVersion`, call `.connect(networkId)`, verify via `getConnectionStatus()`)
// mirrors midnightntwrk/example-bboard's
// bboard-ui/src/contexts/BrowserDeployedBoardManager.ts (fetched and read directly
// via `gh api` on 2026-09-13 — see docs/TOOLCHAIN.md), reimplemented with plain
// async/await instead of rxjs to avoid pulling in a dependency this SDK doesn't
// otherwise need. Browser-only (no Node built-ins), so it lives in the universal
// barrel alongside commitments/payment-link, not in `./node.ts`.

import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { bech32m } from "@scure/base";
import { hexToBytes } from "./encoding.js";

const COMPATIBLE_API_MAJOR = 4;

/**
 * Converts the connector's shielded coin public key into Compact's 32-byte
 * representation. DApp Connector v4 specifies Bech32m (`mn_shield-cpk_…`),
 * while older mocks and wallets may still expose the underlying 64 hex digits.
 */
export const decodeShieldedCoinPublicKey = (key: string): Uint8Array => {
  const value = key.trim();
  const rawHex = /^(?:0x)?([0-9a-fA-F]{64})$/.exec(value)?.[1];
  if (rawHex) return hexToBytes(rawHex);

  try {
    const decoded = bech32m.decodeToBytes(value, false);
    const [midnightPrefix, keyType] = decoded.prefix.toLowerCase().split("_");
    if (midnightPrefix !== "mn" || keyType !== "shield-cpk") {
      throw new Error(`expected mn_shield-cpk, received ${decoded.prefix}`);
    }
    if (decoded.bytes.length !== 32) {
      throw new Error(`expected 32 bytes, received ${decoded.bytes.length}`);
    }
    return Uint8Array.from(decoded.bytes);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Wallet returned an invalid shielded coin public key (${detail}).`);
  }
};

const isCompatible = (wallet: unknown): wallet is InitialAPI => {
  if (!wallet || typeof wallet !== "object" || !("apiVersion" in wallet)) return false;
  const version = (wallet as { apiVersion: unknown }).apiVersion;
  return typeof version === "string" && Number.parseInt(version.split(".")[0] ?? "", 10) === COMPATIBLE_API_MAJOR;
};

/**
 * Returns every DApp Connector-compatible wallet currently injected, or an empty
 * array if none / not in a browser. Reads `window.midnight` via an explicit local
 * cast rather than relying on `@midnight-ntwrk/dapp-connector-api`'s own ambient
 * `declare global { interface Window { midnight?: ... } } `: that augmentation
 * turned out not to merge reliably under every module-resolution mode (it
 * typechecked fine under a consumer using `moduleResolution: "bundler"`, but not
 * under this package's own `"NodeNext"`) — real, observed behavior, not a
 * hypothetical, so this SDK doesn't depend on a downstream consumer's resolution
 * settings lining up with the dependency's.
 */
export const listAvailableWallets = (): InitialAPI[] => {
  if (typeof window === "undefined") return [];
  const midnight = (window as { midnight?: Record<string, InitialAPI> }).midnight;
  if (!midnight) return [];
  return Object.values(midnight).filter(isCompatible);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Polls for a compatible wallet for up to `timeoutMs`, then connects to it. Throws a
 * plain, user-displayable Error on timeout or connection failure — the expected,
 * honest outcome in any environment without a real Midnight wallet extension
 * installed, not something to work around with a fallback.
 */
export const connectWallet = async (networkId: string, timeoutMs = 20_000): Promise<ConnectedAPI> => {
  const deadline = Date.now() + timeoutMs;
  let wallet: InitialAPI | undefined;
  while (Date.now() < deadline) {
    wallet = listAvailableWallets()[0];
    if (wallet) break;
    await sleep(100);
  }
  if (!wallet) {
    throw new Error("No Midnight wallet found. Install a DApp Connector-compatible wallet extension and reload.");
  }

  const connectedApi = await wallet.connect(networkId);
  const status = await connectedApi.getConnectionStatus();
  if (status.status !== "connected") {
    throw new Error("Wallet did not confirm a connection. Is the extension unlocked and authorized for this site?");
  }
  return connectedApi;
};
