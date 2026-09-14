// This file is part of Nivra.
// SPDX-License-Identifier: Apache-2.0
//
// Mirrors the pattern in midnightntwrk/example-counter's counter-cli/src/common-types.ts
// (fetched and read directly via `gh api` on 2026-09-13 — see docs/TOOLCHAIN.md),
// adapted from Counter to InvoiceRegistry. Kept as a separate file, matching that
// reference, because these type aliases are shared by both the deploy/join layer
// (contract.ts) and the provider-wiring layer (providers.ts).

import { InvoiceRegistry, type NivraPrivateState } from "@nivra/contracts";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js/types";
import type { DeployedContract, FoundContract } from "@midnight-ntwrk/midnight-js/contracts";
import type { ProvableCircuitId } from "@midnight-ntwrk/compact-js";

export type InvoiceRegistryCircuits = ProvableCircuitId<InvoiceRegistry.Contract<NivraPrivateState>>;

export const InvoiceRegistryPrivateStateId = "nivraInvoiceRegistryMerchantPrivateState";
export const InvoiceRegistryPayerPrivateStateId = "nivraInvoiceRegistryPayerPrivateState";
export type InvoiceRegistryPrivateStateIds =
  | typeof InvoiceRegistryPrivateStateId
  | typeof InvoiceRegistryPayerPrivateStateId;

export type InvoiceRegistryProviders = MidnightProviders<
  InvoiceRegistryCircuits,
  InvoiceRegistryPrivateStateIds,
  NivraPrivateState
>;

export type InvoiceRegistryContractType = InvoiceRegistry.Contract<NivraPrivateState>;

export type DeployedInvoiceRegistryContract =
  | DeployedContract<InvoiceRegistryContractType>
  | FoundContract<InvoiceRegistryContractType>;
