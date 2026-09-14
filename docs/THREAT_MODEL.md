# Threat Model

## Actors analyzed

Malicious merchant, malicious payer, replay attacker, front-runner, external observer,
compromised frontend, compromised backend (N/A in Wave 1 — no backend exists; revisit
in Wave 2), metadata observer, fake-invoice creator, unauthorized invoice canceller,
duplicate-settlement attacker, fake-receipt claimant, malicious API client (N/A in
Wave 1 — no API exists yet).

## Security properties

- **Invoice authenticity** — an invoice's existence and terms cannot be forged; the
  commitment is only satisfiable by whoever knew the real preimage.
- **Settlement integrity** — an invoice becomes PAID only via a real, verified value
  transfer of the correct amount/token into the contract, never by calling a "mark
  paid" function on its own.
- **Merchant authorization** — cancellation requires proving knowledge of
  `merchantSecret` matching the stored `merchantCommitment`; no operation
  authorizes itself by simply re-supplying the public commitment.
- **Replay resistance** — the invoice state machine (not a bolted-on nullifier) makes
  double-settlement structurally impossible: `settleInvoice` asserts `state ==
  ACTIVE` and the very first thing it does is flip state away from `ACTIVE`.
- **Receipt authenticity** — a `receiptCommitment` is only ever written by the
  `settleInvoice` circuit itself, at the moment of real settlement; it cannot be
  fabricated by calling a receipt-issuing circuit directly.
- **State-transition integrity** — enforced entirely in Compact (see
  `docs/STATE_MACHINE.md`); the frontend has no authority over lifecycle state.
- **Confidentiality** — see `docs/PRIVACY_MODEL.md`.
- **Unlinkability** — partial; honestly scoped in `docs/PRIVACY_MODEL.md`.
- **Failure atomicity** — payer debit, merchant payout, receipt registration, and the
  PAID transition occur in one circuit call. A failed assertion commits none of them.
- **Resistance to unauthorized mutation** — every mutating circuit either requires no
  special authorization (permissionless, like `markExpired`, where anyone triggering a
  state-cleanup that only succeeds if the deadline has genuinely passed is harmless)
  or requires a witness-proven secret.

## Per-operation analysis

### `createInvoice`
- **Who can call it:** anyone (a merchant, by convention — nothing on-chain
  distinguishes "a merchant" before their first invoice).
- **Authorization proof:** none required to *create* — creating an invoice commits
  the caller to nothing except their own `merchantSecret`, which they choose.
- **Attacker calls it:** an attacker can create junk invoice commitments freely. This
  costs them transaction fees (DUST) and produces entries no one will ever pay,
  because no one else knows the preimage/link. Not a meaningful attack — it's
  equivalent to sending yourself junk mail.
- **Publicly revealed:** the commitment, initial state (`ACTIVE`), `merchantCommitment`,
  `expiry`.
- **Replay/front-run/double-call:** a duplicate `invoiceCommitment` is rejected
  (`Map.insert` on an existing key must fail or be guarded by an explicit
  non-membership assertion) — collision would require breaking `persistentHash` or
  guessing the full preimage including `nonce`/`invoiceSecret`, treated as
  infeasible. Calling it twice with the same preimage is a no-op/rejected, not a
  double invoice.
- **Partial failure:** the circuit either fully commits or fully reverts; no
  intermediate state is observable.

### `cancelInvoice`
- **Who can call it:** anyone can *attempt* it.
- **Authorization proof:** witness `merchantSecret` must satisfy
  `persistentHash(DOMAIN_MERCHANT, merchantSecret, merchantNonce) ==
  storedMerchantCommitment`.
- **Attacker calls it without the secret:** proof fails to satisfy the assertion; the
  circuit rejects. An attacker cannot cancel someone else's invoice without the
  merchant's private secret — this is the central authorization guarantee, and it is
  not implemented as "compare the caller's supplied commitment to itself" (the
  anti-pattern explicitly called out in Phase 5), it is a real hash-preimage proof.
- **Publicly revealed:** nothing beyond the state transition itself.
- **Replay:** cancelling a non-`ACTIVE` invoice is rejected by the state guard.
- **Front-run:** a payer's `settleInvoice` and a merchant's `cancelInvoice` racing for
  the same invoice resolve by whichever transaction lands first on-chain; the loser's
  transaction fails its `state == ACTIVE` assertion. This is standard, acceptable
  blockchain race behavior, not a vulnerability — no value is created or lost either
  way.

### `settleInvoice`
- **Who can call it:** the payer (whoever holds the real preimage and a real shielded
  coin of the matching value/color).
- **Authorization proof:** recomputing `invoiceCommitment` from the full witness
  preimage and checking `Map.member` against the stored key; the actual value
  transfer is enforced by `receiveShielded`, which the Compact runtime itself accounts
  for — a caller cannot call `receiveShielded` and lie about the coin's value, because
  the coin's contents are cryptographically bound, not caller-asserted.
- **Attacker calls it without paying:** cannot succeed — `receiveShielded` requires
  the caller to actually own and spend a real coin of the matching value; there is no
  code path that flips state to PAID without it.
- **Settlement without a real invoice:** rejected by the `Map.member` check on the
  recomputed commitment.
- **Double payment:** rejected — the second call sees `state != ACTIVE`.
- **Settlement after cancellation/expiry:** rejected by the same state guard, plus
  `blockTimeLt(expiry)` for the expiry case specifically.
- **Wrong merchant:** not directly applicable — settlement isn't merchant-scoped by
  caller identity, it's scoped by which `invoiceCommitment` the payer targets; paying
  the wrong commitment simply pays a different, unrelated invoice (if it exists) or
  fails membership (if it doesn't). Funds cannot be misdirected to an unintended
  merchant because the commitment already encodes `merchantCommitment` and is
  recomputed/checked before `receiveShielded` runs.
- **Publicly revealed:** the state transition to PAID and the new `receiptCommitment`
  entry; nothing about the amount, token, or payer.
- **Payout redirection:** rejected because the supplied payout key must match the
  `payoutKeyCommitment` fixed during `createInvoice`.

### `markExpired`
- **Who can call it:** anyone (permissionless by design — it's a public good, not a
  privileged action).
- **Authorization proof:** none needed; the only assertion is `blockTimeGte(expiry)`
  and `state == ACTIVE`.
- **Attacker calls it "early":** cannot succeed — `blockTimeGte` uses the chain's own
  block-time source, never a caller-supplied timestamp.
- **Griefing potential:** none — this only ever moves a genuinely-expired invoice to
  a terminal state that `settleInvoice` would have rejected anyway.

## Cross-cutting attacks

- **Compromised frontend:** cannot mint fake PAID states or forge cancellations
  (no secrets available to it beyond what the merchant/payer explicitly
  holds), can at worst show a user misleading UI — mitigated by clients recomputing
  commitments and checking chain state directly rather than trusting any single UI's
  claims.
- **Metadata observer** watching the public ledger sees: commitment existence,
  lifecycle state, `merchantCommitment` reuse across invoices, and `expiry` values.
  This is the honestly-scoped leakage documented in `docs/PRIVACY_MODEL.md`.
- **Fake-receipt claimant:** cannot produce a valid `receiptCommitment` proof without
  the payer's real `payerReceiptSecret`, which only exists because `settleInvoice`
  actually ran.
