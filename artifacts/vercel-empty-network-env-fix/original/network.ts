// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Network endpoints, matching docs/TOOLCHAIN.md's assumed target network
// (Preprod, with Preview as fallback) and the exact URLs verified against
// midnightntwrk/example-counter's counter-cli/src/config.ts.

export type NetworkId = "preprod" | "preview";

export type NetworkConfig = {
  readonly networkId: NetworkId;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly proofServer: string;
};

const NETWORKS: Record<NetworkId, NetworkConfig> = {
  preprod: {
    networkId: "preprod",
    indexer: "https://indexer.preprod.midnight.network/api/v3/graphql",
    indexerWS: "wss://indexer.preprod.midnight.network/api/v3/graphql/ws",
    // No public proof server — per docs/TOOLCHAIN.md this project has no Docker/proof-server
    // available in its own dev sandbox either. A real deployment needs a proof server the
    // browser can reach (self-hosted, e.g. via NEXT_PUBLIC_PROOF_SERVER_URL).
    proofServer: process.env.NEXT_PUBLIC_PROOF_SERVER_URL ?? "http://127.0.0.1:6300",
  },
  preview: {
    networkId: "preview",
    indexer: "https://indexer.preview.midnight.network/api/v3/graphql",
    indexerWS: "wss://indexer.preview.midnight.network/api/v3/graphql/ws",
    proofServer: process.env.NEXT_PUBLIC_PROOF_SERVER_URL ?? "http://127.0.0.1:6300",
  },
};

export const getNetworkConfig = (): NetworkConfig =>
  NETWORKS[(process.env.NEXT_PUBLIC_NETWORK_ID as NetworkId | undefined) ?? "preprod"];
