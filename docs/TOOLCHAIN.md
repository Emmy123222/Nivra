# Toolchain

Nivra is built against a specific, verified snapshot of the Midnight toolchain. Every
version below was confirmed against live Midnight documentation and/or by running the
tools directly, on 2026-09-12 (contract-layer versions) and 2026-09-13 (SDK/deployment-
layer versions, added when `packages/sdk`'s deploy/join code was built). Nothing here
is guessed. When a version is bumped, this file must be updated in the same commit,
with a reason.

## Why 0.31.1, not the newest compiler

Two Compact compiler versions were available locally: `0.31.1` and `0.34.0` (the
current published latest). They were compared directly:

```
$ compact compile --version            # 0.31.1  -> 0.34.0
$ compact compile --ledger-version     # ledger-8.0.2  -> ledger-9.1.0.0-rc.3
$ compact compile --language-version   # 0.23.0  -> 0.26.0
$ compact compile --runtime-version    # 0.16.0  -> 0.19.0
```

`0.34.0` targets `ledger-9.1.0.0-rc.3` — an explicit **release candidate**. The stable
JS ecosystem this project depends on (`@midnight-ntwrk/midnight-js` `^4.0.4` and
`@midnight-ntwrk/ledger-v8`, as pinned in the official `midnightntwrk/example-counter`
v2.1.1 repo) targets ledger v8, not v9-rc. Compiling against 0.34.0 would produce
contracts whose expected ledger shape does not match the client/indexer/proof-server
stack that is actually deployed on Preview/Preprod/Mainnet today.

**Decision: pin the Compact compiler to `0.31.1`.** Re-evaluate only once there is
evidence (a dated release note, or a matching `@midnight-ntwrk/ledger-v9` stable
release) that the JS ecosystem has moved to ledger v9.

## Pinned versions

| Component | Version | Verified via |
|---|---|---|
| Compact compiler (`compactc`, invoked via `compact compile`) | `0.31.1` | `compact compile --version` on this machine |
| Compact language pragma | `pragma language_version >= 0.23;` | `compact compile --language-version` → `0.23.0` |
| Compact devtools CLI (`compact`) | `0.5.2` | `compact --version`; pre-installed at `~/.local/bin/compact` |
| Expected ledger | `ledger-8.0.2` | `compact compile --ledger-version` |
| `@midnight-ntwrk/compact-runtime` (npm) | `0.16.0` | `compact compile --runtime-version`. Note: `midnightntwrk/example-counter` v2.1.1 (the source for the `@midnight-ntwrk/midnight-js*`/wallet-sdk pins below) itself pins `0.15.0`, one minor version behind. This project uses `0.16.0` because that is what compiler `0.31.1` actually declares and requires — installing `0.15.0` instead would risk a silent contract/runtime shape mismatch for the sake of matching an unrelated example repo's lockfile. Flagged, not glossed over. |
| `@midnight-ntwrk/ledger-v8` (npm) | `^8.0.0` | `midnightntwrk/example-counter` root `package.json` (v2.1.1) |
| `@midnight-ntwrk/midnight-js` | `^4.1.1` | `example-counter` v2.1.1 pins `^4.0.4`; bumped to `^4.1.1` (still pre-5.0.0, same major) after confirming it installs cleanly alongside `compact-js@2.5.1` on 2026-09-13 — see the `compact-js` version-selection note below |
| `@midnight-ntwrk/midnight-js-http-client-proof-provider` | `^4.1.1` | same reasoning |
| `@midnight-ntwrk/midnight-js-indexer-public-data-provider` | `^4.1.1` | same reasoning |
| `@midnight-ntwrk/midnight-js-level-private-state-provider` | `^4.1.1` | same reasoning |
| `@midnight-ntwrk/midnight-js-node-zk-config-provider` | `^4.1.1` | same reasoning |
| `@midnight-ntwrk/wallet-sdk-hd` / `-facade` / `-address-format` / `-dust-wallet` | `^3.0.0` | same |
| `@midnight-ntwrk/wallet-sdk-shielded` / `-unshielded-wallet` | `^2.0.0` | same |
| `@midnight-ntwrk/dapp-connector-api` | `^4.0.1` (CAIP-372, type-based redesign, released 2026-01-28) | docs.midnight.network/api-reference/dapp-connector, npm |
| `@midnight-ntwrk/compact-js` | `^2.5.1` — **not** the newest published version, see below | `CompiledContract`/`ProvableCircuitId`, confirmed by fetching and reading `midnightntwrk/example-counter`'s `counter-cli/src/api.ts` and `counter-cli/src/common-types.ts` directly via `gh api` on 2026-09-13. Missing from `docs/TOOLCHAIN.md` until now — a real gap this session's SDK work found, not present in the original toolchain pass. |
| Proof server | Docker image `midnightntwrk/proof-server:8.1.0`, port 6300 | docs.midnight.network/getting-started/installation |
| Node.js | v20.20.2 (confirmed working locally) | this machine |
| Networks | Preview, Preprod, Mainnet | docs.midnight.network/relnotes/overview |

## Target network

No Buildathon-specific rules page was available to consult. **Preprod is assumed** as
the default target network (it is the default in the official example repos' CLI/UI
network selectors), with Preview as fallback. This assumption must be confirmed
against the actual Buildathon rules and corrected here if wrong — see
`docs/BUILD_STATUS.md` for this open item.

## Why `@midnight-ntwrk/compact-js@2.5.1`, not the newest published version (2.5.5-rc.8 or 2.5.3)

`npm view @midnight-ntwrk/compact-js versions` lists `2.5.3` as the newest non-RC
release. Installing it fails outright:

```
npm error notarget No matching version found for @midnight-ntwrk/ledger-v9@^0.1.0-alpha.1.
```

`compact-js@2.5.3`'s own `package.json` depends on `@midnight-ntwrk/ledger-v9@^0.1.0-alpha.1`,
a version that was never published (`npm view @midnight-ntwrk/ledger-v9 versions` shows
only `1.0.0-rc.3`/`1.0.0-rc.4` exist) — the published package is simply broken to
install, not a judgment call to weigh. Checking each version between the known-good
`2.4.3` (ledger-v7, compact-runtime 0.14.0 — too old, predates our stack) and the
broken `2.5.3` by hand:

| compact-js | ledger dependency | compact-runtime dependency |
|---|---|---|
| 2.4.3 | ledger-v7 7.0.0 | 0.14.0 |
| 2.5.0-rc.1 | ledger-v8 8.0.0 | 0.15.0-rc.0 |
| 2.5.0 | ledger-v8 ^8.0.3 | 0.15.0 |
| **2.5.1** | **ledger-v8 ^8.0.3** | **0.16.0** |
| 2.5.3 | ledger-v9 ^0.1.0-alpha.1 (unpublished) | 0.16.0 |

`2.5.1` is the only version whose `compact-runtime` dependency (`0.16.0`) exactly
matches what our pinned compiler (`0.31.1`) actually requires, while still resolving
to an installable package. **Decision: pin `@midnight-ntwrk/compact-js` to `^2.5.1`.**
Installed and confirmed resolvable on 2026-09-13; do not bump past it without
re-running this same version-by-version check.

One residual note, stated plainly rather than assumed away: `compact-js@2.5.1` wants
`@midnight-ntwrk/ledger-v8@^8.0.3`, while `compact compile --ledger-version` reports
this project's expected ledger as `ledger-8.0.2`. Patch-version ledger bumps are
expected to be backward compatible, and no incompatibility has been observed, but this
has not been proven by an actual deployment — tracked as an open item in
`docs/BUILD_STATUS.md`, not silently assumed fine.

## Empirically verified byte encodings (`pad`, numeric-to-`Bytes<32>` casts)

Needed for `packages/sdk`'s client-side commitment verification (Phase 16: a payer
must be able to recompute an invoice's commitment from payment-link data before
trusting it) to be byte-identical to what the circuit itself computes. Rather than
assume these from memory or a doc summary, they were confirmed by compiling and
running real throwaway probe circuits with the installed `compact` `0.31.1` CLI on
2026-09-13 (probes were deleted after use; not committed):

- `pad(32, "some-tag")` → UTF-8 bytes of the string literal, zero-padded on the right
  to 32 bytes. Verified with both a short tag and one filling the full 32 bytes.
- `<Uint<64>> as Field as Bytes<32>` → little-endian bytes of the value using 8 bytes,
  zero-padded on the right to 32 bytes. Verified with a value with 8 distinct
  non-zero bytes (`0x0102030405060708`) to unambiguously reveal byte order.
- `<Uint<128>> as Field as Bytes<32>` → same pattern, 16 bytes instead of 8 (Zswap
  coin `value` is `Uint<128>`, distinct from `amount`/`expiry`'s `Uint<64>`).

Encoded in `packages/sdk/src/encoding.ts`; cross-checked against the real compiled
`InvoiceRegistry` contract's actual commitment output in
`packages/sdk/src/test/commitments.test.ts` (not just the probe run, so a future
compiler change that alters this encoding fails a real test, not just this doc).

## Frontend toolchain (`apps/web`)

Verified on 2026-09-13 by fetching and reading `midnightntwrk/example-bboard`'s
`bboard-ui` (a real, working DApp Connector-based browser frontend) in full via
`gh api`, the same discipline as the SDK layer above:

| Component | Version | Verified via |
|---|---|---|
| Next.js | `16.3.5` | `npm view next version` (latest stable) on 2026-09-13 |
| React / React DOM | `19.2.8` | pinned by `create-next-app@latest` |
| Tailwind CSS | `^4` | pinned by `create-next-app@latest` |
| `@midnight-ntwrk/midnight-js-protocol` | `4.1.1` | `example-bboard` root `package.json`; needed directly (not just transitively) to avoid a real duplicate-package type-identity conflict — see below |
| `@midnight-ntwrk/midnight-js-fetch-zk-config-provider` | `4.1.1` | same; the browser analog of `NodeZkConfigProvider`, confirmed by reading its compiled source for the exact `keys/`/`zkir/` URL layout it expects |
| `@midnight-ntwrk/dapp-connector-api` | `4.0.1` | same, matches the pin already established above |
| `qrcode` | `^1.5.4` | ordinary npm package, no Midnight-specific verification needed |

**Real dependency-duplication finding:** installing `@midnight-ntwrk/ledger-v8`
directly (as `contracts`/`example-counter` do) alongside `@midnight-ntwrk/midnight-js-types`
(which depends on `ledger-v8` *through* `@midnight-ntwrk/midnight-js-protocol`)
resulted in **two separate copies** of `ledger-v8` in the dependency tree, with
incompatible private-field identity for classes like `SignatureEnabled` — `tsc`
reported "Types have separate declarations of a private property 'type_'". Fixed by
depending on `@midnight-ntwrk/midnight-js-protocol` directly (matching what
`example-bboard` itself does) and importing `Transaction`/`SignatureEnabled`/`Proof`/
`Binding`/`FinalizedTransaction` from `@midnight-ntwrk/midnight-js-protocol/ledger`
instead of a separately-installed `ledger-v8`, so there is exactly one copy. See
`docs/BUILD_STATUS.md` for the two further frontend-specific bugs found this way
(the `@nivra/sdk` barrel/Node-`fs` issue and the `isomorphic-ws`/Turbopack issue).

## Environment limitation: no local proof server

Docker is not available in the current development sandbox, so the local proof server
(`midnightntwrk/proof-server:8.1.0`) cannot be run here. Consequences, stated plainly:

- Contract tests in this environment use `@midnight-ntwrk/compact-runtime`'s in-process
  circuit simulation (the same approach `example-counter`/`example-bboard` use for
  `vitest` unit tests) — this exercises circuit logic, assertions, and ledger state
  transitions, but does **not** generate real zero-knowledge proofs.
- A full end-to-end proof-generation run (real proving keys, real proofs) requires a
  developer machine with Docker to run the proof server, and is out of scope for
  automated tests in this sandbox. This is documented, not faked — see Phase 27 review
  and `BUILD_STATUS.md`.

## Relevant Compact language surface (verified against `compact compile --help` and
official docs/example source, not assumed)

- Declarations: `pragma language_version`, `import CompactStandardLibrary`, `ledger`,
  `witness`, `circuit` (`export`, `pure`), `struct`, `enum`, `constructor`.
- Ledger state types confirmed in use: `Counter` (`.increment(n)`), `Map<K,V>`,
  `Set<T>`; `MerkleTree`/`HistoricMerkleTree` documented but not required for Wave 1.
- Built-in types: `Boolean`, `Field`, `Uint<n>`, `Bytes<n>`, `Opaque<"tag">`,
  `Vector<n,T>`, tuples.
- Hash/commitment primitives: `persistentHash<T>(value): Bytes<32>` (SHA-256-based,
  stable across upgrades — used for all domain-separated commitments in this project),
  `transientHash<T>(value): Field` (circuit-efficient, not upgrade-stable — not used
  for anything requiring long-term stability), `keccak256`, `persistentCommit`,
  `transientCommit`.
- Explicit disclosure: `disclose(value)` — required before writing witness-derived
  data to ledger state or returning it from an exported circuit. This is Compact's
  built-in enforcement of the public/private boundary described in
  `docs/PRIVACY_MODEL.md`.
- Block-time primitives: `blockTimeLt`, `blockTimeGte`, `blockTimeGt`,
  `blockTimeLte(time: Uint<64>): Boolean` — the only trustworthy source of "now" in a
  circuit. Caller-supplied timestamps are never trusted (see `docs/THREAT_MODEL.md`).
- Payment primitives (Zswap shielded pool): `receiveShielded(coin: ShieldedCoinInfo)`,
  `sendShielded(input: QualifiedShieldedCoinInfo, recipient, value)`,
  `sendImmediateShielded`, `createZswapOutput`; unshielded equivalents
  `sendUnshielded`/`receiveUnshielded`; `ownPublicKey(): ZswapCoinPublicKey`.
  **Verified directly against the compiler (2026-09-12), not assumed:** `compact
  compile` was run against a real `settleInvoice`/`claimSettlement` draft.
  `ShieldedCoinInfo` has accessible `.color`/`.value` fields; `receiveShielded(coin)`
  and `sendShielded(input, recipient, value)` both type-check with the signatures
  above. Critically, the compiler's own disclosure analysis reports that calling
  `receiveShielded` **discloses a link between the receive event and the coin's
  commitment**, and calling `sendShielded` **discloses a link between the spend and
  the input coin's commitment, and between the resulting change output and its
  commitment** — both require an explicit `disclose()` at the call site to compile.
  This is a real, load-bearing privacy fact for this protocol, not a hypothetical:
  amount and token color stay off the public ledger (per `PRIVACY_MODEL.md`), but the
  specific coin object moved during settlement/claim is linkable on-chain by
  construction of Zswap's own accounting. Documented precisely in
  `docs/PRIVACY_MODEL.md` rather than glossed over.
- Token model: `NIGHT` is the public/unshielded governance and fee-generation token;
  `DUST` is a shielded, **non-transferable**, decaying resource burned to pay fees —
  neither is designed to be a merchant payment currency. Real invoice settlement in
  this project moves a Zswap **shielded token** (arbitrary `color`) via
  `receiveShielded`/`sendShielded`, which is what actually gives us amount- and
  (subject to the verification above) recipient-privacy for payments.
