"use client";
// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// React context tying together wallet connection, provider construction, and
// the merchant's deployed InvoiceRegistry contract, so every page can share
// one connection instead of reconnecting per-screen.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { encodeCoinPublicKey } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { createNivraPrivateState, type NivraPrivateState, InvoiceRegistry } from "@nivra/contracts";
import {
  deployInvoiceRegistry,
  joinInvoiceRegistry,
  getInvoiceRegistryLedger,
  connectWallet,
  listAvailableWallets,
  type DeployedInvoiceRegistryContract,
  type InvoiceRegistryProviders,
} from "@nivra/sdk";
import { buildBrowserProviders } from "./providers";
import { getNetworkConfig } from "./network";
import { getOrCreateMerchantCredential, getStoredContractAddress, setStoredContractAddress } from "./invoice-store";

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

type WalletState = {
  readonly status: WalletStatus;
  readonly error: string | null;
  readonly connectedApi: ConnectedAPI | null;
  readonly contract: DeployedInvoiceRegistryContract | null;
  readonly connecting: boolean;
  readonly deployingContract: boolean;
  readonly providers: InvoiceRegistryProviders | null;
  readonly walletAvailable: boolean | null;
  readonly connect: () => Promise<void>;
  readonly dismissError: () => void;
  readonly ensureContract: () => Promise<DeployedInvoiceRegistryContract>;
  readonly getLedger: () => Promise<InvoiceRegistry.Ledger | null>;
};

const WalletContext = createContext<WalletState | null>(null);

const zkConfigPath = () => (typeof window !== "undefined" ? window.location.origin : "");

export function WalletContextProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [connectedApi, setConnectedApi] = useState<ConnectedAPI | null>(null);
  const [contract, setContract] = useState<DeployedInvoiceRegistryContract | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [deployingContract, setDeployingContract] = useState(false);
  const [providers, setProviders] = useState<Awaited<ReturnType<typeof buildBrowserProviders>> | null>(null);
  const [walletAvailable, setWalletAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let checks = 0;
    const detect = () => {
      const available = listAvailableWallets().length > 0;
      setWalletAvailable(available);
      checks += 1;
      if (available || checks >= 40) window.clearInterval(timer);
    };
    const timer = window.setInterval(detect, 500);
    detect();
    return () => window.clearInterval(timer);
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    setStatus("connecting");
    try {
      const network = getNetworkConfig();
      const api = await connectWallet(network.networkId);
      const built = await buildBrowserProviders(api, network);
      setConnectedApi(api);
      setProviders(built);
      setStatus("connected");

      // Restore the merchant's registry immediately after a reload. Previously
      // the dashboard stayed in a half-connected state until another action
      // happened to call ensureContract().
      const existingAddress = getStoredContractAddress();
      if (existingAddress) {
        const { merchantSecret, merchantNonce } = getOrCreateMerchantCredential();
        const addresses = await api.getShieldedAddresses();
        const restored = await joinInvoiceRegistry(
          built,
          zkConfigPath(),
          existingAddress,
          createNivraPrivateState(
            merchantSecret,
            merchantNonce,
            encodeCoinPublicKey(addresses.shieldedCoinPublicKey),
          ),
        );
        setContract(restored);
      }
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  }, []);

  const ensureContract = useCallback(async (): Promise<DeployedInvoiceRegistryContract> => {
    if (contract) return contract;
    if (!providers || !connectedApi) throw new Error("Connect a wallet before creating or opening an InvoiceRegistry contract.");

    setDeployingContract(true);
    try {
      const { merchantSecret, merchantNonce } = getOrCreateMerchantCredential();
      const addresses = await connectedApi.getShieldedAddresses();
      const privateState: NivraPrivateState = createNivraPrivateState(
        merchantSecret,
        merchantNonce,
        encodeCoinPublicKey(addresses.shieldedCoinPublicKey),
      );
      const existingAddress = getStoredContractAddress();

      const deployed = existingAddress
        ? await joinInvoiceRegistry(providers, zkConfigPath(), existingAddress, privateState)
        : await deployInvoiceRegistry(providers, zkConfigPath(), privateState);

      if (!existingAddress) {
        setStoredContractAddress(deployed.deployTxData.public.contractAddress);
      }
      setContract(deployed);
      return deployed;
    } finally {
      setDeployingContract(false);
    }
  }, [contract, providers, connectedApi]);

  const getLedger = useCallback(async (): Promise<InvoiceRegistry.Ledger | null> => {
    const address = getStoredContractAddress();
    if (!providers || !address) return null;
    return getInvoiceRegistryLedger(providers, address);
  }, [providers]);

  const value = useMemo<WalletState>(
    () => ({
      status,
      error,
      connectedApi,
      contract,
      connecting,
      deployingContract,
      providers,
      walletAvailable,
      connect,
      dismissError: () => setError(null),
      ensureContract,
      getLedger,
    }),
    [status, error, connectedApi, contract, connecting, deployingContract, providers, walletAvailable, connect, ensureContract, getLedger],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet() must be used within <WalletContextProvider>");
  return ctx;
}
