# Security Review

Phase 27 attacker-first review of `contracts/src/invoice_registry.compact`,
`packages/sdk`, and `apps/web`, performed before calling Wave 1 complete. Every
finding below was checked against the real code — either an existing automated test
already proves the mitigation, or a new test was written during this review to prove
it (and, where a real gap was found, to prove the fix). Nothing here is asserted
without a corresponding test name to back it up.

Severity scale: **Critical** (funds/privacy lost with no user error), **High**
(exploitable but requires a specific precondition), **Medium** (real but low-impact
or requires privileged access), **Low** (hygiene/defense-in-depth), **Informational**
(a design tradeoff worth stating plainly, not a bug).

## Findings

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | `createInvoice` accepted `amount == 0` | Low | **Fixed** |
| 2 | No test at the exact `time == expiry` boundary | Low (process gap, not a code bug — the code was already correct) | **Fixed** (test added) |
| 3 | Delayed settlement claims required unavailable contract-coin index recovery | High | **Fixed** by atomic transient payout (INVARIANT 8) |
| 4 | Circuit simulation cannot verify that a settlement coin is a real, previously-unspent Zswap UTXO | Informational | **Documented**, not fixable in this environment |
| 5 | All of a merchant's invoices are linkable to each other via the shared public `merchantCommitment` | Informational | **Documented** (already in `docs/PRIVACY_MODEL.md`, confirmed here) |
| 6 | Payment is permissionless (anyone with a link can pay any invoice) | Informational | **By design**, not a bug |

### 1. Zero-amount invoices (Low) — Fixed

**Reproduction:** `createInvoice(0n, tokenColor, expiry, metadataHash, invoiceSecret, nonce)` succeeded before this review, registering a real, ACTIVE, zero-amount invoice.

**Impact:** Not exploitable by a third party — only the invoice's own merchant (via
their `merchantSecret`) can create an invoice under their own commitment, so this
could not be used to attack another merchant. Impact is limited to a merchant
accidentally or pointlessly creating a meaningless invoice; no funds or privacy are
at risk. Classified Low rather than Medium/High for that reason.

**Fix:** `assert(amount > 0, "Amount must be positive")`, first line of
`createInvoice`. Verified by `contracts/src/test/invoice_registry.test.ts`,
"rejects a zero-amount invoice".

### 2. Expiry boundary condition (Low, process) — Fixed

**Reproduction attempted:** set block time to exactly `expiry` (not before, not
after) and check both `settleInvoice` and `markExpired` at that exact instant. This
specific instant was not previously covered by any test, which is itself the
finding — an off-by-one between `blockTimeLt`/`blockTimeGte` (e.g. if one had used
`Lte`/`Gt` instead) would have created either a payable-and-simultaneously-expirable
window (a real race) or a stuck window where neither succeeds, and nothing would
have caught it.

**Result:** the code was already correct — at `time == expiry`, `settleInvoice`
correctly throws "Invoice has expired" and `markExpired` correctly succeeds. No code
change; the gap was in test coverage, now closed by
"at the exact deadline instant, treats the invoice as expired, not payable (no
off-by-one gap)".

### 3. Delayed claim custody/index gap (High) — Fixed

Documented in full in `docs/INVARIANTS.md` (INVARIANT 8) and `docs/BUILD_STATUS.md`.
Restated here because it belongs in this review's record: a delayed withdrawal needs
the qualified Merkle index of the contract-owned output, but the browser wallet API
does not give that private contract coin to the merchant. The live flow now consumes
the new contract output in the same transaction as a transient (`mt_index = 0`) and
sends it to the payout key committed at invoice creation. A modified link with a
different payout key is rejected. Verified by the "ATOMIC PAYOUT" tests.

### 4. Fake settlement via simulation-only witness trust (Informational) — environment limitation

**Attack attempted:** call `settleInvoice` with a witness-provided coin
(`incomingPaymentCoin`) whose `nonce`/`color`/`value` are simply asserted by the
caller, without ever having actually received a real Zswap payment.

**Finding, stated plainly:** in this project's test environment
(`@midnight-ntwrk/compact-runtime` circuit simulation, no proof server — see
`docs/TOOLCHAIN.md`), the circuit's own logic only checks that the witness coin's
declared `color`/`value` match the invoice's expected values; it cannot independently
verify that this coin corresponds to a real, previously-unspent UTXO the caller
actually controls, because no real ledger or ZK proof verification runs in
simulation. **On the real Midnight network, this is not a gap**: `receiveShielded`
compiles to a real Zswap accounting operation, and the surrounding transaction must
carry a valid proof and be accepted by the network's own nullifier/double-spend
checks before `settleInvoice` can execute at all — fabricating "receipt" of a coin
that doesn't exist is prevented by the ledger layer, not by this contract. This
project's contract-level tests (correctly) exercise the circuit's *logic*
(assertions, state transitions); they cannot and do not claim to exercise Zswap's
own proof/ledger enforcement, because doing so requires the live proof
server/network this sandbox does not have. Recorded here so this boundary is never
mistaken for "tested," consistent with `docs/BUILD_STATUS.md`'s existing honesty
about this limitation.

### 5. Merchant-invoice linkability (Informational) — already documented

Every invoice a merchant creates carries the same public `merchantCommitment`. An
outside observer of the public ledger can therefore tell "these N invoices come from
the same merchant" without learning the merchant's real-world identity or any
invoice's contents. This is already stated in `docs/PRIVACY_MODEL.md` ("Unlinkability
across invoices is partial in Wave 1") — confirmed correct and current during this
review, not a new finding, but recorded here because Phase 27 explicitly calls out
"metadata correlation" as an attack category to check.

### 6. Payment is permissionless (Informational) — by design

Anyone holding a payment link can call `settleInvoice` for that invoice; the
contract does not check the payer's identity. This is intentional (the product is
"pay this invoice," not "only a specific wallet may pay this invoice," matching how
a Stripe Payment Link or an invoice number works) and is documented in
`docs/PROTOCOL_ARCHITECTURE.md`. Listed here because Phase 27 calls out "payer
impersonation" as a category to check — there is no payer identity to impersonate
by design, so this resolves to "not applicable," not "unmitigated."

## Attack-category checklist (Phase 27)

For each category, what was checked and where the evidence lives:

| Category | Checked how | Evidence |
|---|---|---|
| Unauthorized cancellation | Attacker without `merchantSecret` calls `cancelInvoice` | contract tests: "rejects cancellation by an attacker without the merchant's secret" |
| Fake settlement | Witness coin mismatched in color/value; also see Finding 4 above | contract tests: "rejects settlement when the offered coin's value does not match the invoice amount"; Finding 4 |
| Double settlement | Settle an already-PAID invoice | contract tests: "rejects a second settlement attempt against an already-PAID invoice" |
| Payout redirection / replay | Substitute a payout key or submit settlement twice | redirected-key test + double-settlement test; Finding 3 |
| Commitment manipulation | Distinct inputs must give distinct/stable commitments | contract tests: "gives two invoices with different nonces different commitments"; SDK `commitments.test.ts` (4 tests, byte-exact match against the real circuit) |
| Receipt forgery | Wrong secret; unpaid invoice; secret from a *different* paid invoice | SDK `contract.test.ts`: "rejects a wrong receipt secret", "rejects an invoice that was never paid", "rejects invoice A's genuine receipt secret when presented against invoice B's commitment" (added this review) |
| Merchant impersonation | Cancel without the real `merchantSecret` | contract cancellation authorization tests |
| Payer impersonation | N/A by design | Finding 6 |
| Expiry bypass | Settle after expiry; mark-expire before expiry; exact boundary | contract tests: "EXPIRY" suite (6 tests after this review, including Finding 2) |
| Privacy leakage | Public `InvoiceRecord` schema never widens to leak private fields | contract tests: "PRIVACY" suite, asserts the exact public field list |
| Metadata correlation | Merchant-invoice linkability via shared `merchantCommitment` | Finding 5 |
| Malformed inputs | Compact's static types (`Bytes<32>`, `Uint<64>`) reject non-conforming values at the type level before any circuit logic runs; zero-amount specifically checked (Finding 1) | Compiler type-checking (structural); contract tests |
| DoS | Every state-changing call requires a real, fee-paying transaction on a real network; no unbounded loop or unbounded-size structure exists in the contract | Code review of `invoice_registry.compact` (no loops, no caller-controlled-size collections) |
| State corruption | Invalid state transitions (e.g. PAID→ACTIVE, CANCELLED→PAID) | `docs/INVARIANTS.md`; contract tests confirm every implemented transition and that terminal states reject further mutation |
| Payment/state desynchronization | `receiveShielded` + ledger state update + receipt write all happen inside one circuit execution | Structural: Compact circuits execute atomically as part of one transaction — no code path exists where one succeeds and the others don't |

## What this review does not, and cannot, cover here

- Real proof generation and verification (no local proof server; the installed
  browser wallet's delegated prover has not yet been approved for this DApp).
- Real network consensus/finality behavior, front-running by block producers, or
  mempool-level transaction ordering attacks — these depend on the deployed
  network's actual behavior, not this contract's logic.
- The frontend's resistance to a compromised browser extension environment or a
  malicious wallet implementation — out of scope for a contract/SDK security review,
  and partially addressed by design already (Nivra never receives spending keys;
  see `docs/PROTOCOL_ARCHITECTURE.md`).
- A real Preprod submission requiring the installed browser wallet to be unlocked,
  connected, funded, and explicitly approved (see `docs/BUILD_STATUS.md`).

These are stated as open items, not silently assumed safe.
