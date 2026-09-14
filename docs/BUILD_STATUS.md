# Build Status

Status values: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `DONE`, `TESTED`. Nothing is
marked `DONE` unless it runs; nothing is marked `TESTED` unless an automated or
reproducible test exists for it.

| Component | Status | Notes |
|---|---|---|
| Toolchain verification | DONE | `docs/TOOLCHAIN.md`; compiler pinned to 0.31.1 with documented reasoning |
| Product spec | DONE | `docs/PRODUCT_SPEC.md` |
| Privacy model | DONE | `docs/PRIVACY_MODEL.md` |
| Threat model | DONE | `docs/THREAT_MODEL.md` |
| Protocol architecture | DONE | `docs/PROTOCOL_ARCHITECTURE.md` |
| State machine | DONE | `docs/STATE_MACHINE.md` |
| Invariants | DONE | `docs/INVARIANTS.md` |
| Wave 1 scope | DONE | `docs/WAVE1_SCOPE.md` |
| Repository scaffold | DONE | directories + root package.json + LICENSE + README created; git initialized |
| Smallest valid Compact contract | DONE | `contracts/src/invoice_registry.compact` compiles cleanly with `compact compile` (exit 0) |
| Contract: invoice commitment registration (`createInvoice`) | TESTED | 3 tests: valid create, duplicate rejected, distinct nonces give distinct commitments |
| Contract: merchant authorization (`cancelInvoice`, `claimSettlement`) | TESTED | hash-preimage proof against `merchantCommitment`, not self-comparison; 3 cancel-auth tests + 2 claim-auth tests |
| Contract: cancellation | TESTED | valid cancel, double-cancel rejected, cancelled invoice can't be settled |
| Contract: expiry (`blockTimeLt`/`blockTimeGte`, `markExpired`) | TESTED | 5 tests using `advanceTimeTo` on the simulator; confirmed real block-time semantics, not assumed |
| Contract: atomic settlement via `receiveShielded` + `sendShielded` | TESTED | matching value/color is received and routed as a transient coin to the merchant key committed at invoice creation; redirected-key, double-payment, cancellation, expiry, and nonexistent-invoice paths tested |
| Contract: payout binding | TESTED | `payoutKeyCommitment` prevents a modified payment link from redirecting funds; settlement sets `claimed = true` atomically |
| Receipt commitment | TESTED | covered by the settlement test asserting `receipts.member(commitment)` |
| Contract tests (circuit simulation) | TESTED | `contracts/src/test/invoice_registry.test.ts`, 24/24 passing; run via `npm test --workspace=contracts` |
| SDK: commitment/verification layer (`@nivra/sdk`) | TESTED | `computeMerchantCommitment`/`computeInvoiceCommitment`/`computeCoinCommitment`/`computeReceiptCommitment`; 4/4 tests cross-check output against the real compiled contract's own `createInvoice` result, byte-for-byte |
| SDK: contract deployment/circuit-call layer | DONE | `packages/sdk/src/{common-types,providers,contract}.ts`; typechecks cleanly against the real installed `@midnight-ntwrk/midnight-js@4.1.1`/`compact-js@2.5.1` packages; not run end-to-end (no proof server/live network in this sandbox) — see below |
| Frontend (`apps/web`) | DONE | Next.js 16 + Tailwind app; all 6 routes (landing, dashboard, create, checkout, connect, receipt) verified rendering with zero console/page errors in a real headless browser (Playwright); see below |
| SDK: `getInvoiceStatus`/`verifyReceipt`/`verifyInvoicePaymentLink`/receipt links/`connectWallet` | TESTED | added to close the gap against `docs/WAVE1_SCOPE.md`'s named SDK surface; 21 SDK tests total, including cross-invoice receipt-replay |
| Security review (Phase 27) | TESTED | `docs/SECURITY_REVIEW.md`; one real Low-severity gap found and fixed (zero-amount invoices), one test-coverage gap closed (exact expiry boundary), full attack-category checklist with evidence |

## Frontend (`apps/web`)

Built only after the contract and SDK layers were tested, per the project's own
ordering rule. Real Next.js 16 (App Router) + Tailwind app, not a mockup — wired to
`@nivra/sdk`/`@nivra/contracts` for real logic wherever that logic doesn't require a
live network connection this sandbox cannot provide.

**Screens implemented:** landing (`/`), wallet-connect explainer (`/connect`), merchant
dashboard with connect/deploy/invoice-list gating (`/dashboard`), create-invoice form
that calls the real `createInvoice` circuit (`/dashboard/create`), invoice details with
a real QR-coded payment link (`/dashboard/invoices/[commitment]`), and customer
checkout that parses a real payment link, recomputes its commitment, and attempts a
real on-chain membership check (`/checkout`).

**What is implemented:**
- Payment-link generation, decoding, and commitment verification (`@nivra/sdk`'s
  `payment-link.ts`/`commitments.ts`) are real, pure, and already unit-tested — these
  work identically here and in production.
- `createInvoice`/`cancelInvoice` calls, contract deploy/join, and ledger reads go
  through the real `deployContract`/`findDeployedContract`/`callTx` machinery from
  `@nivra/sdk`'s contract layer — this is real code, not a mock, but it has only been
  typechecked, never executed against a live network (same limitation as the SDK
  layer — no proof server/wallet in this sandbox).
- The DApp Connector wallet-connect flow (`src/lib/wallet-connector.ts`) is real,
  working detection/connect code, verified end-to-end in a headless browser: it
  correctly polls for `window.midnight`, times out, and reports "No Midnight wallet
  found" — the honest, correct outcome in an environment with no wallet extension
  installed, not a fake success.
- Checkout reads the payer's shielded balances, verifies the invoice on-chain,
  constructs the contract's exact requested output, and lets
  `balanceUnsealedTransaction` select wallet inputs and change. `settleInvoice`
  atomically receives that output, spends it as a transient coin to the committed
  merchant payout key, and registers the payer's receipt. No delayed custodial claim
  or Merkle-index discovery is required.
- Provider configuration now follows the wallet's selected indexer and prover URI,
  validates the network ID, restores an existing merchant registry on reconnect, and
  keeps merchant/payer private states under separate IDs.

**Verification performed:** `npx tsc --noEmit` and `npx eslint src` both clean.
`npm run dev` started successfully; all 5 main routes (`/`, `/dashboard`,
`/dashboard/create`, `/checkout`, `/connect`) returned HTTP 200 and were loaded in a
real headless Chromium via Playwright with **zero console or page errors**. The
wallet-connect failure path and the checkout page's payment-link parsing/display were
each exercised end-to-end with a real generated link/real connect attempt and
confirmed to render the correct, honest state (screenshots taken, not just HTTP
status codes). Connected-wallet states (dashboard with invoices, successful
create-invoice submission) could not be exercised — there is no Midnight wallet
extension available in this sandbox to connect through.

### Three real bugs found and fixed while getting the frontend running

1. **SDK barrel-export architecture bug.** `@nivra/sdk`'s single flat `index.ts`
   barrel re-exported both browser-safe code (commitments, payment links) and
   Node-only provider code (`NodeZkConfigProvider`, `levelPrivateStateProvider` — both
   use `fs`). Because ES module evaluation isn't lazy per named export, importing
   *anything* from `@nivra/sdk` in the browser pulled in the Node-only file's
   top-level `fs/promises` import, and Turbopack refused to build at all. Fixed by
   splitting Node-only provider wiring into a separate `@nivra/sdk/node` subpath
   (`src/node.ts`), never imported by browser code.
2. **`isomorphic-ws` browser build incompatibility.** `@midnight-ntwrk/midnight-js-indexer-public-data-provider`
   does `import * as ws from 'isomorphic-ws'` then accesses `ws.WebSocket` — but
   `isomorphic-ws`'s actual browser build (`browser.js`, read directly) only has a
   default export, no named `WebSocket` export. Turbopack's strict ESM analysis
   refused to build this. `midnightntwrk/example-bboard`'s own Vite-based frontend
   depends on `@originjs/vite-plugin-commonjs`, almost certainly to paper over this
   same class of issue for Vite. Fixed for Turbopack with a `turbopack.resolveAlias`
   in `next.config.ts` pointing `isomorphic-ws` at a two-line local shim
   (`src/lib/isomorphic-ws-shim.ts`) exposing the browser's native `WebSocket` under
   both the default and named export shapes the real package's two builds use.
3. **SSR/hydration bug from reading `localStorage` during render.** The invoice
   details page originally called `getStoredInvoice(commitment)` directly in the
   component body. `localStorage` doesn't exist during Next.js's server-side render,
   and even if guarded, a value that differs between the server-rendered HTML and the
   client's first render triggers a React hydration mismatch. Fixed by initializing
   the relevant state as `undefined` (server-safe) and populating it from
   `localStorage` inside a `useEffect` (client-only timing), with a `Loading…` state
   in between. All `invoice-store.ts` functions were also given `typeof window ===
   "undefined"` guards as defense in depth.

These are recorded here rather than silently fixed and forgotten because each is a
real, generalizable lesson about this specific toolchain (Next.js 16 + Turbopack +
the Midnight JS packages) that the next person extending this frontend needs, not
just a one-off typo.

## SDK commitment layer (`packages/sdk`) — what it is and how it was verified

`packages/sdk/src/commitments.ts` gives callers (eventually: the checkout frontend) a
way to independently recompute an invoice's on-chain commitment from the private
invoice fields carried in a payment link, per Phase 16 ("client verifies invoice
commitment" before the customer pays). It does this by calling the *actual*
`persistentHash`/`CompactTypeVector`/`CompactTypeBytes` builtins exported by
`@midnight-ntwrk/compact-runtime` — the same functions the compiled circuit itself
calls — rather than a hand-written hash reimplementation that could silently drift.

Two byte-encoding details this depends on (`pad(n, "tag")` and `<Uint<k>> as Field as
Bytes<32>`) are not fully nailed down by any documentation summary, so instead of
assuming them, they were verified empirically: throwaway probe circuits were compiled
with the real `compact` CLI and run through the real compiled JS to observe their
literal byte output, before being encoded in `packages/sdk/src/encoding.ts`. Findings:
- `pad(n, "tag")` = UTF-8 bytes of the string, zero-padded on the right to `n` bytes.
- `<Uint<k>> as Field as Bytes<32>` = little-endian bytes of the value using `k/8`
  bytes, zero-padded on the right to 32 bytes. Verified separately for `Uint<64>`
  (amount/expiry) and `Uint<128>` (Zswap coin `value`) since the byte width differs.

`packages/sdk/src/test/commitments.test.ts` then closes the loop: it builds the real
`InvoiceRegistry.Contract` from `@nivra/contracts`, calls `createInvoice`, and asserts
the SDK's `computeMerchantCommitment`/`computeInvoiceCommitment` output is byte-identical
to what the contract itself produced and stored — not merely "this hash function looks
right," but "this matches the actual circuit," reproducibly, in CI.

`@nivra/contracts` was given a real build pipeline (`tsconfig.build.json`, `npm run
build` → `dist/`, `exports`/`main`/`types` in `package.json`) specifically so
`@nivra/sdk` could depend on it as a normal npm workspace package rather than reaching
into another package's `src/`. Verified end-to-end from a clean checkout: `rm -rf
contracts/src/managed contracts/dist packages/sdk/dist && npm test` (root script now
runs `compact` → build `contracts` → build `sdk` → test both workspaces) — 26/26 tests
green.

## SDK: contract deployment/circuit-call layer

Built directly on top of the real `midnightntwrk/example-counter` (v2.1.1, the same
repo `docs/TOOLCHAIN.md`'s version pins were taken from), fetched from GitHub via
`gh api` and read in full (`counter-cli/src/api.ts`, `common-types.ts`, `config.ts`,
root and cli `package.json`), rather than assumed from memory:

- `packages/sdk/src/common-types.ts` — `InvoiceRegistryCircuits`, `InvoiceRegistryProviders`,
  `DeployedInvoiceRegistryContract`, mirroring `counter-cli/src/common-types.ts` exactly,
  adapted from `Counter` to `InvoiceRegistry`.
- `packages/sdk/src/contract.ts` — `compileInvoiceRegistry`/`deployInvoiceRegistry`/
  `joinInvoiceRegistry`/`getInvoiceRegistryLedger`, mirroring `deploy`/`joinContract`/
  `getCounterLedgerState` in the fetched `api.ts`. Uses real witnesses
  (`CompiledContract.withWitnesses`), not `withVacantWitnesses` as example-counter does
  — Counter has no real witnesses, InvoiceRegistry does (merchant secret, coins, etc.),
  so the vacant-witness path genuinely does not apply here and using it would have been
  copying the reference too literally rather than reasoning about the actual contract.
- `packages/sdk/src/providers.ts` — `buildInvoiceRegistryProviders`, mirroring
  `configureProviders` in the fetched `api.ts`, but deliberately **not** copying its
  wallet-construction code: that file also builds a Node wallet from a raw seed via
  `HDWallet`/`WalletFacade`/`ShieldedWallet`/`UnshieldedWallet`/`DustWallet`, which is
  right for a CLI demo but wrong for a general SDK — a browser frontend authenticates
  through the DApp Connector instead, an entirely different, not-yet-verified API
  surface. The SDK instead accepts any already-constructed `WalletProvider &
  MidnightProvider` and wires it to the ZK/proof/indexer/private-state providers every
  consumer needs identically. Building the Node-wallet-from-seed path (useful for a
  CLI demo script) and the DApp Connector bridge (needed by the real frontend) are both
  separate, not-yet-done tasks — not files this session skipped by mistake.

**A real, load-bearing dependency-resolution finding, not present in the original
toolchain pass:** `@midnight-ntwrk/compact-js` was entirely missing from
`docs/TOOLCHAIN.md` until this session (needed for `CompiledContract`/`ProvableCircuitId`).
Worse, its newest published version (`2.5.3`) is **broken to install** — it depends on
`@midnight-ntwrk/ledger-v9@^0.1.0-alpha.1`, a version that was never published. Checking
every version between the known-good `2.4.3` and the broken `2.5.3` by hand found
`2.5.1` as the only installable version whose `compact-runtime` dependency (`0.16.0`)
exactly matches what this project's pinned compiler (`0.31.1`) requires. Pinned to
`^2.5.1`; full reasoning and the version-by-version table are in `docs/TOOLCHAIN.md`.
This is exactly the kind of thing Rule #1 ("verify Midnight before coding") exists to
catch — picking the "latest" version by habit here would have produced a package that
cannot even be installed, not a subtle runtime bug.

**Verification performed and its limits, stated plainly:** `packages/sdk` typechecks
cleanly (`npm run typecheck`, `npm run build`) against the real installed
`@midnight-ntwrk/midnight-js@4.1.1` / `@midnight-ntwrk/compact-js@2.5.1` /
`@midnight-ntwrk/compact-runtime@0.16.0` packages — every generic type constraint in
`deployContract`/`findDeployedContract`/`CompiledContract`/`MidnightProviders` that
this code touches was checked against the actual shipped `.d.ts` files, not assumed. It
has **not** been run against a live proof server, indexer, or wallet — no Docker in
this sandbox (see `docs/TOOLCHAIN.md`), so there is no way here to construct a real
`WalletProvider & MidnightProvider` or exercise `deployContract` end-to-end. Marked
`DONE`, deliberately not `TESTED`, per this file's own rule at the top.

## Real correctness gaps found and fixed during testing

The earlier delayed-claim design required the merchant client to recover a qualified
contract-owned coin's Merkle index after checkout. The DApp Connector does not expose
that contract coin to the merchant wallet. The implementation now avoids that brittle
custody boundary: settlement receives and spends the new coin in one call, using the
ledger's supported transient-output path (`mt_index = 0`). A payout-key commitment
binds the destination before the invoice is shared, so a payer cannot redirect it.
Tests cover atomic payout and malicious key substitution.

## Verification items — resolved by actually compiling, not by reading docs alone

1. **`Map` operation names** (`.member()`, `.lookup()`, `.insert()`) — confirmed
   correct; the contract compiles using exactly these.
2. **`ShieldedCoinInfo`/`QualifiedShieldedCoinInfo` shapes and `receiveShielded`/
   `sendShielded` signatures** — confirmed correct as documented in
   `docs/TOOLCHAIN.md`. New finding, verified via the compiler's own disclosure
   analysis rather than assumed: both calls require `disclose()` because they link
   the receive/spend event to that specific coin's commitment. Folded into
   `docs/PRIVACY_MODEL.md`.
3. **Circuit-parameter disclosure model** — not something any documentation summary
   surfaced: exported-circuit parameters are treated as witness-like by the
   compiler's disclosure tracker, and require an explicit `disclose()` before being
   written to ledger state, passed to `blockTimeGte`/`blockTimeLt`, or passed to
   `receiveShielded`/`sendShielded`. This shaped the final circuit bodies in
   `invoice_registry.compact` and is worth knowing before writing more circuits.

## Open verification items (not yet resolved)

1. **Buildathon target network** — assumed Preprod (see `docs/TOOLCHAIN.md`); no
   Buildathon-specific rules page was available. Confirm and correct if wrong.
2. **Coin-linkability implication for the privacy story** — `docs/PRIVACY_MODEL.md`
   now states plainly that the specific coin object used in settlement/claim is
   linkable via its commitment, even though amount/token-color never touch the
   ledger. Whether this is acceptable for the product's privacy claims, or whether
   Wave 2 needs an additional mixing/relayer step, is a product decision, not a
   technical unknown — flagging for discussion, not blocking Wave 1.
3. **Delayed claim/index discovery** — removed from the live path by atomic transient
   payout; see INVARIANT 8.
4. **Full end-to-end test against a real deployed network** (real proof server, real
   testnet transaction, real wallet) has not been attempted — everything above is
   circuit-level simulation, which is honest and useful but is not the same claim as
   "this works on Preprod." That remains the next real milestone once Docker/a wallet
   are available.
5. **`expiry`'s unit** — the frontend's create-invoice form assumes `expiry` is
   seconds since the Unix epoch (the common block-timestamp convention across chains),
   since no documentation source pinned this down and it cannot be observed without a
   live network's real block-time clock. Stated as an assumption in
   `apps/web/src/app/dashboard/create/page.tsx`, not silently baked in.

## Environment limitations (documented, not worked around silently)

- No Docker in this sandbox → no local proof server → no full end-to-end proof
  generation test here. Contract tests will use `compact-runtime` circuit simulation.
- No confirmed Buildathon rules document was supplied by the user as of this writing.
