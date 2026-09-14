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
import { fromHex, toHex } from "@midnight-ntwrk/midnight-js-utils";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import type { InvoiceRegistryCircuits, InvoiceRegistryProviders } from "@nivra/sdk";
import { InvoiceRegistryPrivateStateId } from "@nivra/sdk";
import type { NivraPrivateState } from "@nivra/contracts";
import { browserPrivateStateProvider } from "./private-state-provider";
import type { NetworkConfig } from "./network";

/** Builds the full InvoiceRegistryProviders bundle for a browser session, given a connected wallet. */
export const buildBrowserProviders = async (
  connectedApi: ConnectedAPI,
  network: NetworkConfig,
): Promise<InvoiceRegistryProviders> => {
  const zkConfigPath = typeof window !== "undefined" ? window.location.origin : "";
  const zkConfigProvider = new FetchZkConfigProvider<InvoiceRegistryCircuits>(zkConfigPath);
  const shieldedAddresses = await connectedApi.getShieldedAddresses();

  return {
    privateStateProvider: browserPrivateStateProvider<typeof InvoiceRegistryPrivateStateId, NivraPrivateState>(),
    publicDataProvider: indexerPublicDataProvider(network.indexer, network.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(network.proofServer, zkConfigProvider),
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
