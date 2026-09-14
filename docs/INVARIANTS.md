# Protocol Invariants

Each invariant states the guarantee, which circuit(s) enforce it, and how it is (or
will be) tested. "Tested" means an automated test exists in `contracts/test/`; see
`docs/BUILD_STATUS.md` for current status per invariant.

### INVARIANT 1 — An invoice can settle at most once.
Enforced by: `settleInvoice`'s `assert(state == ACTIVE)` guard plus the fact that
`settleInvoice` is the only circuit that transitions to `PAID`, and it flips state
away from `ACTIVE` before returning. A second call against the same commitment always
observes `state != ACTIVE`.

### INVARIANT 2 — Every PAID invoice corresponds to a valid payment.
Enforced by: `settleInvoice` calling `receiveShielded(coin)` — a real, runtime-
accounted value transfer — as a precondition of writing `state = PAID`. There is no
code path to `PAID` that skips this call.

### INVARIANT 3 — A cancelled invoice can never become PAID.
Enforced by: `CANCELLED` is terminal; `settleInvoice`'s `state == ACTIVE` guard
rejects any invoice not in `ACTIVE`, including `CANCELLED`.

### INVARIANT 4 — Only the authorized merchant can cancel.
Enforced by: `cancelInvoice` requires a witness `merchantSecret` such that
`persistentHash(DOMAIN_MERCHANT, merchantSecret, merchantNonce) ==
storedMerchantCommitment`. No comparison of a caller-supplied commitment to itself is
used anywhere in this protocol.

### INVARIANT 5 — A valid receipt corresponds to a valid settlement.
Enforced by: `receipts[invoiceCommitment]` is written only inside `settleInvoice`,
at the same point `state` is flipped to `PAID`; no other circuit writes to `receipts`.

### INVARIANT 6 — Private invoice metadata does not appear in public ledger state.
Enforced by: the ledger schema itself — `InvoiceRecord` contains only `state`,
`merchantCommitment`, and `expiry`. `amount`, `tokenColor`, `metadataHash`,
`invoiceSecret`, and `nonce` are witness inputs used only to recompute and check the
commitment hash; Compact's `disclose()` requirement makes any accidental leak of these
into ledger state a compile-time-visible event (an explicit `disclose()` call would
have to appear at the write site), not a silent runtime one.

### INVARIANT 7 — Settlement cannot create value from nothing.
Enforced by: `receiveShielded` is a Midnight runtime primitive backed by the Zswap
shielded pool's own conservation-of-value accounting (spent-coin nullifiers, Merkle
membership) — this contract does not implement value accounting itself, it relies on
and defers to Midnight's own ledger for that guarantee.

### INVARIANT 8 — Merchant funds can be claimed at most once per settled invoice, and
only the coin that actually settled that specific invoice.
(Added beyond the prompt's list because `claimSettlement` introduces its own
double-spend surface — found and fixed during implementation, not anticipated in the
original design.) `InvoiceRecord` carries `paidCoinCommitment` (written by
`settleInvoice`, a domain-separated hash of the received coin's `nonce`/`color`/
`value`) and a `claimed: Boolean` flag. `claimSettlement` asserts `!record.claimed`,
recomputes the same hash from the `heldCoin` witness, asserts it equals
`record.paidCoinCommitment`, and only then sets `claimed = true`. Without this,
a merchant with multiple paid invoices could point `claimSettlement` at any coin the
contract holds, claiming the same underlying coin against more than one invoice, or
double-claiming the same invoice. Tested in
`contracts/src/test/invoice_registry.test.ts` ("CLAIM SETTLEMENT" suite).

### INVARIANT 9 — An invoice cannot be marked EXPIRED before its deadline.
Enforced by: `markExpired`'s `assert(blockTimeGte(expiry))`, which reads the chain's
own block-time source — never a caller-supplied value (see `docs/THREAT_MODEL.md`).
