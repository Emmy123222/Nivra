// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Browser PrivateStateProvider, adapted from midnightntwrk/example-bboard's
// bboard-ui/src/in-memory-private-state-provider.ts (fetched and read
// directly via `gh api` on 2026-09-13 — see docs/TOOLCHAIN.md), which
// verified the current PrivateStateProvider interface shape for us. Ported
// rather than written from scratch so the interface (setContractAddress,
// export/import, signing keys) matches a real, working reference exactly.
//
// One deliberate change from that reference: this stores to `localStorage`
// instead of an in-memory Map, so a merchant's invoices survive a page
// reload — a real demo needs that. This is a genuine, documented Wave 1
// security tradeoff, not an oversight: unlike the upstream export/import
// methods (which describe AES-256-GCM encryption), nothing here is
// encrypted. Anything written through this provider — including the
// merchant's private witness state — sits in plaintext in this browser's
// localStorage. That is acceptable for a hackathon demo running against a
// throwaway credential, and is explicitly NOT how Wave 2 production should
// store merchant secrets (see docs/THREAT_MODEL.md and docs/BUILD_STATUS.md).

import type { ContractAddress, SigningKey } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import type {
  ExportPrivateStatesOptions,
  ExportSigningKeysOptions,
  ImportPrivateStatesOptions,
  ImportPrivateStatesResult,
  ImportSigningKeysOptions,
  ImportSigningKeysResult,
  PrivateStateExport,
  PrivateStateId,
  PrivateStateProvider,
  SigningKeyExport,
} from "@midnight-ntwrk/midnight-js-types";

const STORAGE_KEY = "nivra:demo-private-state-provider:v1";

type PersistedShape = {
  privateStates: Record<string, Record<string, string>>; // contractAddress -> stateId -> JSON
  signingKeys: Record<string, string>; // contractAddress -> JSON(SigningKey)
};

const loadPersisted = (): PersistedShape => {
  if (typeof window === "undefined") return { privateStates: {}, signingKeys: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { privateStates: {}, signingKeys: {} };
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    return { privateStates: parsed.privateStates ?? {}, signingKeys: parsed.signingKeys ?? {} };
  } catch {
    return { privateStates: {}, signingKeys: {} };
  }
};

const savePersisted = (data: PersistedShape): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

/** A `localStorage`-backed `PrivateStateProvider` for the browser. See the file-level comment re: no encryption. */
export const browserPrivateStateProvider = <PSI extends PrivateStateId, PS = unknown>(): PrivateStateProvider<
  PSI,
  PS
> => {
  let contractAddress: ContractAddress | null = null;

  const requireContractAddress = (): ContractAddress => {
    if (contractAddress === null) {
      throw new Error("Contract address not set. Call setContractAddress() before accessing private state.");
    }
    return contractAddress;
  };

  // JSON does not preserve Uint8Array and throws on bigint. Both occur in real
  // Compact private state after settlement, so use tagged values rather than
  // silently reloading byte arrays as plain objects after a page refresh.
  const encode = <T>(value: T): string =>
    JSON.stringify(value, (_key, current: unknown) => {
      if (typeof current === "bigint") return { __nivraType: "bigint", value: current.toString() };
      if (current instanceof Uint8Array) {
        return { __nivraType: "bytes", value: Array.from(current) };
      }
      return current;
    });
  const decode = <T>(value: string): T =>
    JSON.parse(value, (_key, current: unknown) => {
      if (!current || typeof current !== "object" || !("__nivraType" in current)) return current;
      const tagged = current as { __nivraType: string; value: unknown };
      if (tagged.__nivraType === "bigint" && typeof tagged.value === "string") return BigInt(tagged.value);
      if (tagged.__nivraType === "bytes" && Array.isArray(tagged.value)) return new Uint8Array(tagged.value);
      return current;
    }) as T;

  return {
    setContractAddress(address: ContractAddress): void {
      contractAddress = address;
    },

    set(key: PSI, state: PS): Promise<void> {
      const data = loadPersisted();
      const address = requireContractAddress();
      data.privateStates[address] ??= {};
      data.privateStates[address][key] = encode(state);
      savePersisted(data);
      return Promise.resolve();
    },

    get(key: PSI): Promise<PS | null> {
      const data = loadPersisted();
      const address = requireContractAddress();
      const raw = data.privateStates[address]?.[key];
      return Promise.resolve(raw !== undefined ? decode<PS>(raw) : null);
    },

    remove(key: PSI): Promise<void> {
      const data = loadPersisted();
      const address = requireContractAddress();
      delete data.privateStates[address]?.[key];
      savePersisted(data);
      return Promise.resolve();
    },

    clear(): Promise<void> {
      const data = loadPersisted();
      delete data.privateStates[requireContractAddress()];
      savePersisted(data);
      return Promise.resolve();
    },

    setSigningKey(address: ContractAddress, signingKey: SigningKey): Promise<void> {
      const data = loadPersisted();
      data.signingKeys[address] = encode(signingKey);
      savePersisted(data);
      return Promise.resolve();
    },

    getSigningKey(address: ContractAddress): Promise<SigningKey | null> {
      const data = loadPersisted();
      const raw = data.signingKeys[address];
      return Promise.resolve(raw !== undefined ? decode<SigningKey>(raw) : null);
    },

    removeSigningKey(address: ContractAddress): Promise<void> {
      const data = loadPersisted();
      delete data.signingKeys[address];
      savePersisted(data);
      return Promise.resolve();
    },

    clearSigningKeys(): Promise<void> {
      const data = loadPersisted();
      data.signingKeys = {};
      savePersisted(data);
      return Promise.resolve();
    },

    exportPrivateStates(options?: ExportPrivateStatesOptions): Promise<PrivateStateExport> {
      void options;
      const data = loadPersisted();
      const address = requireContractAddress();
      return Promise.resolve({
        format: "midnight-private-state-export",
        encryptedPayload: encode({ contractAddress: address, states: data.privateStates[address] ?? {} }),
        salt: "nivra-demo-unencrypted",
      });
    },

    importPrivateStates(
      exportData: PrivateStateExport,
      options?: ImportPrivateStatesOptions,
    ): Promise<ImportPrivateStatesResult> {
      const data = loadPersisted();
      const address = requireContractAddress();
      const conflictStrategy = options?.conflictStrategy ?? "error";
      const payload = decode<{ states?: Record<string, string> }>(exportData.encryptedPayload);
      const incoming = payload.states ?? {};
      data.privateStates[address] ??= {};
      const existing = data.privateStates[address];

      let imported = 0;
      let skipped = 0;
      let overwritten = 0;
      for (const [stateId, serialized] of Object.entries(incoming)) {
        const hasExisting = stateId in existing;
        if (hasExisting) {
          if (conflictStrategy === "skip") {
            skipped += 1;
            continue;
          }
          if (conflictStrategy === "error") {
            return Promise.reject(new Error(`Private state conflict for '${stateId}'`));
          }
          overwritten += 1;
        } else {
          imported += 1;
        }
        existing[stateId] = serialized;
      }
      savePersisted(data);
      return Promise.resolve({ imported, skipped, overwritten });
    },

    exportSigningKeys(options?: ExportSigningKeysOptions): Promise<SigningKeyExport> {
      void options;
      const data = loadPersisted();
      return Promise.resolve({
        format: "midnight-signing-key-export",
        encryptedPayload: encode({ keys: data.signingKeys }),
        salt: "nivra-demo-unencrypted",
      });
    },

    importSigningKeys(
      exportData: SigningKeyExport,
      options?: ImportSigningKeysOptions,
    ): Promise<ImportSigningKeysResult> {
      const data = loadPersisted();
      const conflictStrategy = options?.conflictStrategy ?? "error";
      const payload = decode<{ keys?: Record<string, string> }>(exportData.encryptedPayload);
      const incoming = payload.keys ?? {};

      let imported = 0;
      let skipped = 0;
      let overwritten = 0;
      for (const [address, serialized] of Object.entries(incoming)) {
        const hasExisting = address in data.signingKeys;
        if (hasExisting) {
          if (conflictStrategy === "skip") {
            skipped += 1;
            continue;
          }
          if (conflictStrategy === "error") {
            return Promise.reject(new Error(`Signing key conflict for '${address}'`));
          }
          overwritten += 1;
        } else {
          imported += 1;
        }
        data.signingKeys[address] = serialized;
      }
      savePersisted(data);
      return Promise.resolve({ imported, skipped, overwritten });
    },
  };
};
