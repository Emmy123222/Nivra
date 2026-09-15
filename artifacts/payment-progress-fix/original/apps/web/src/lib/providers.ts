// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Bridges a connected DApp Connector wallet (`ConnectedAPI`) to the
// `WalletProvider & MidnightProvider` shape @midnight-ntwrk/midnight-js's
// `deployContract`/`findDeployedContract`/circuit calls expect. The
// serialize/balance/submit sequence mirrors
// midnightntwrk/example-bboard's bboard-ui/src/contexts/BrowserDeployedBoardManager.ts
// `initializeProviders` (fetched and read directly via `gh api` on
// 2026-09-13 — see docs/TOOLCHAIN.md) exactly: hex-serialize the unbound
// transaction, hand it to the wallet's `balanceUnsealedTransaction`, and
// deserialize what comes back as a fully bound `Transaction`.

import {
  Transaction,
  type SignatureEnabled,
  type Proof,
  type Binding,
  type FinalizedTransaction,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";
import type { UnboundTransaction } from "@midnight-ntwrk/midnight-js-types";
import { createProofProvider, type ProofProvider } from "@midnight-ntwrk/midnight-js-types";
import { fromHex, toHex } from "@midnight-ntwrk/midnight-js-utils";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type { InvoiceRegistryCircuits, InvoiceRegistryProviders } from "@nivra/sdk";
import { type InvoiceRegistryPrivateStateIds } from "@nivra/sdk";
import type { NivraPrivateState } from "@nivra/contracts";
import { browserPrivateStateProvider } from "./private-state-provider";
import type { NetworkConfig } from "./network";

/** Builds the full InvoiceRegistryProviders bundle for a browser session, given a connected wallet. */
export const buildBrowserProviders = async (
  connectedApi: ConnectedAPI,
  network: NetworkConfig,
): Promise<InvoiceRegistryProviders> => {
  const zkConfigPath = typeof window !== "undefined" ? window.location.origin : "";
  // FetchZkConfigProvider stores the supplied function and calls it as a plain
  // callback. Chromium requires Window.fetch to keep its Window receiver, so
  // passing a bound function avoids the otherwise opaque "Illegal invocation"
  // failure when the contract runtime loads verifier keys in production.
  const browserFetch = globalThis.fetch.bind(globalThis);
  const zkConfigProvider = new FetchZkConfigProvider<InvoiceRegistryCircuits>(zkConfigPath, browserFetch);
  // Lace builds in the wild can expose the v4 connection methods while omitting
  // the newer advisory hintUsage helper. Feature-detect it: the hint improves the
  // permission prompt when present, but it is not required to construct providers.
  const hintUsage = (connectedApi as unknown as {
    hintUsage?: ConnectedAPI["hintUsage"];
  }).hintUsage;
  if (typeof hintUsage === "function") {
    try {
      await hintUsage.call(connectedApi, [
        "getConfiguration",
        "getShieldedAddresses",
        "getShieldedBalances",
        "getProvingProvider",
        "balanceUnsealedTransaction",
        "submitTransaction",
      ]);
    } catch {
      // Permission hints are advisory. Some hosted-origin connector sessions
      // throw here before their network configuration has been hydrated.
    }
  }
  // Some released connectors (observed with 1AM on a hosted HTTPS origin)
  // resolve getConfiguration() with `undefined` despite the v4 type contract.
  // Keep wallet-provided endpoints authoritative when present, but validate the
  // runtime value and fall back to Nivra's selected-network endpoints.
  type RuntimeWalletConfiguration = Partial<Awaited<ReturnType<ConnectedAPI["getConfiguration"]>>>;
  const readWalletConfiguration = async (): Promise<RuntimeWalletConfiguration | undefined> => {
    try {
      const value: unknown = await connectedApi.getConfiguration();
      return value && typeof value === "object" ? value as RuntimeWalletConfiguration : undefined;
    } catch {
      return undefined;
    }
  };
  // Keep connector RPC calls ordered. Browser extensions transport these calls
  // over one remote channel, and some wallets race configuration hydration when
  // getConfiguration/getConnectionStatus/getShieldedAddresses are started together.
  const connectionStatus = await connectedApi.getConnectionStatus();
  if (!connectionStatus || connectionStatus.status !== "connected") {
    throw new Error("Wallet connection was lost. Reconnect the wallet and try again.");
  }
  const walletConfig = await readWalletConfiguration();
  const walletNetworkId = walletConfig?.networkId ?? connectionStatus.networkId;
  if (walletNetworkId !== network.networkId) {
    throw new Error(
      `Wallet connected to ${walletNetworkId}, but Nivra is configured for ${network.networkId}. Switch the wallet network and reconnect.`,
    );
  }
  setNetworkId(walletNetworkId);
  const shieldedAddresses = await connectedApi.getShieldedAddresses();

  // Wallet configuration is authoritative for the user's indexer/prover choices.
  // The local network config remains a fallback for wallets that omit the deprecated
  // proverServerUri while delegated proving support is still uneven across extensions.
  const proofServer = walletConfig?.proverServerUri ?? network.proofServer;
  const indexerUri = walletConfig?.indexerUri ?? network.indexer;
  const indexerWsUri = walletConfig?.indexerWsUri ?? network.indexerWS;
  let proofProvider: ProofProvider;
  try {
    const provingProvider = await connectedApi.getProvingProvider({
      getZKIR: (location) => zkConfigProvider.getZKIR(location as InvoiceRegistryCircuits),
      getProverKey: (location) => zkConfigProvider.getProverKey(location as InvoiceRegistryCircuits),
      getVerifierKey: (location) => zkConfigProvider.getVerifierKey(location as InvoiceRegistryCircuits),
    });
    proofProvider = createProofProvider(provingProvider);
  } catch {
    proofProvider = httpClientProofProvider(proofServer, zkConfigProvider);
  }

  return {
    privateStateProvider: browserPrivateStateProvider<InvoiceRegistryPrivateStateIds, NivraPrivateState>(),
    publicDataProvider: indexerPublicDataProvider(indexerUri, indexerWsUri),
    zkConfigProvider,
    proofProvider,
    walletProvider: {
      getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- part of the WalletProvider interface; the DApp Connector's balanceUnsealedTransaction has no ttl parameter to forward it to
      balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
        const serializedTx = toHex(tx.serialize());
        const received = await connectedApi.balanceUnsealedTransaction(serializedTx);
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          "signature",
          "proof",
          "binding",
          fromHex(received.tx),
        ) as FinalizedTransaction;
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction) => {
        await connectedApi.submitTransaction(toHex(tx.serialize()));
        const [txId] = tx.identifiers();
        return txId;
      },
    },
  };
};
