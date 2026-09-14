// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Assembles the MidnightProviders bundle deployContract/findDeployedContract
// need, following the exact pattern in midnightntwrk/example-counter's
// counter-cli/src/api.ts `configureProviders` (fetched and read directly via
// `gh api` on 2026-09-13 — see docs/TOOLCHAIN.md). Deliberately different
// from that reference in one respect: it does NOT construct a wallet. Wallet
// construction (deriving keys from a seed for a Node CLI, vs. bridging a
// browser DApp Connector for the frontend) is genuinely different per
// consumer and is not the SDK's job — per docs/PROTOCOL_ARCHITECTURE.md, the
// SDK sits above the wallet/connector layer, not inside it. Callers supply an
// already-constructed WalletProvider & MidnightProvider (from a Node wallet,
// as example-counter builds one, or from a DApp Connector bridge in a
// browser); this module wires that together with the ZK/proof/indexer/
// private-state providers every consumer needs identically.

import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import type { MidnightProvider, WalletProvider } from "@midnight-ntwrk/midnight-js/types";
import { InvoiceRegistryPrivateStateId, type InvoiceRegistryCircuits, type InvoiceRegistryProviders } from "./common-types.js";

export type InvoiceRegistryNetworkConfig = {
  /** GraphQL HTTP endpoint of the Midnight indexer, e.g. https://indexer.preprod.midnight.network/api/v3/graphql */
  readonly indexer: string;
  /** GraphQL WebSocket endpoint of the Midnight indexer. */
  readonly indexerWS: string;
  /** URL of a running proof server (see docs/TOOLCHAIN.md: midnightntwrk/proof-server:8.1.0, port 6300). */
  readonly proofServer: string;
  /** Filesystem path to the compiled contract's ZK assets (contracts/src/managed/invoice_registry). */
  readonly zkConfigPath: string;
  /** Name for the local private-state store; distinguishes Nivra's data from other contracts sharing the same machine. */
  readonly privateStateStoreName: string;
};

/**
 * Wires an already-authenticated wallet (implementing both `WalletProvider`
 * and `MidnightProvider`, as `WalletFacade`-backed wallets and DApp Connector
 * bridges alike do) together with the remaining providers InvoiceRegistry's
 * deploy/call/find operations need.
 */
export const buildInvoiceRegistryProviders = (
  wallet: WalletProvider & MidnightProvider,
  config: InvoiceRegistryNetworkConfig,
): InvoiceRegistryProviders => {
  const zkConfigProvider = new NodeZkConfigProvider<InvoiceRegistryCircuits>(config.zkConfigPath);
  // Matches example-counter's own storagePassword derivation exactly: the coin
  // public key, base64-encoded, covers all four character classes and avoids
  // repeated-character runs found in raw hex strings — not a cryptographic
  // secret in its own right, just a stable per-account local-storage password.
  const accountId = wallet.getCoinPublicKey();
  const storagePassword = `${Buffer.from(accountId, "hex").toString("base64")}!`;
  return {
    privateStateProvider: levelPrivateStateProvider<typeof InvoiceRegistryPrivateStateId>({
      privateStateStoreName: config.privateStateStoreName,
      accountId,
      privateStoragePasswordProvider: () => storagePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
};
