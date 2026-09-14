# Privacy Model

Every field in the protocol is classified below as **PUBLIC**, **PRIVATE**,
**SELECTIVELY DISCLOSED**, or **OFF-CHAIN ENCRYPTED**, with the reasoning. Wave 1 has
no backend, so "off-chain encrypted" in Wave 1 means "carried only inside the
encrypted payment-link payload, never transmitted to any server"; a real off-chain
encrypted store (for e.g. developer-facing metadata retrieval) is Wave 2.

## Design principle

The public ledger stores the *minimum* needed for anyone to verify the protocol
behaved correctly: that an invoice with a given commitment exists, its lifecycle
state, which merchant-commitment authorizes mutating it, and the deadline used for
enforcement. Everything that makes an invoice commercially meaningful — amount,
token, notes, who's paying — is never written to public ledger state. It exists only
as a hash preimage that the merchant and customer exchange directly (via the payment
link), and is checked by recomputing the same hash client-side or in-circuit.

## Field classification

| Field | Classification | Reasoning |
|---|---|---|
| `invoiceCommitment` (`persistentHash` of the full preimage; used as the `Map` key) | PUBLIC | A hash alone reveals nothing about its preimage; its presence is what "invoice exists" means |
| Invoice lifecycle state (`ACTIVE`/`PAID`/`CANCELLED`/`EXPIRED`) | PUBLIC | Global verifiability of settlement requires this to be checkable by anyone, including the customer before they pay |
| `merchantCommitment` (`persistentHash(DOMAIN_MERCHANT, merchantSecret, merchantNonce)`) | PUBLIC | Needed on-chain so `cancelInvoice`/`claimSettlement` can check authorization without ever learning `merchantSecret`; reveals nothing about the merchant's real-world identity |
| `expiry` (block-time deadline, `Uint<64>`) | PUBLIC | Required for in-circuit `blockTimeLt/Gte` enforcement; a bare deadline number is low-sensitivity on its own |
| `amount` | PRIVATE (preimage-only, never written to ledger) | The chain never needs to know the amount — it only needs `receiveShielded`'s value to match what the payer/merchant privately agreed, checked as a witness equality inside the circuit |
| `tokenColor` (which shielded token type) | PRIVATE (preimage-only) | Same reasoning as amount — which asset is being used is commercially sensitive |
| `metadataHash` (hash of merchant notes/line items) | PRIVATE (folded into the commitment preimage, not stored separately) | Lets the customer verify the metadata blob they were given matches what the merchant committed to, without publishing the hash itself on-chain |
| `invoiceSecret` | PRIVATE (preimage-only) | Prevents an observer from brute-forcing/enumerating invoice commitments from public data alone — without it, a well-resourced attacker could try guessing (merchant, amount, expiry) tuples |
| `nonce` | PRIVATE (preimage-only) | Entropy: makes the commitment hiding even if every other preimage field is later disclosed or guessed |
| `merchantSecret` | PRIVATE (witness-only, never leaves the merchant's client) | The actual authorization credential |
| Payer settlement/receipt secrets | PRIVATE (witness-only, never leaves the payer's client) | Used to derive `receiptCommitment`; only the payer can later prove they hold the matching receipt |
| `receiptCommitment` | PUBLIC | A hash only; presence proves *some* receipt was issued for this invoice, without revealing to whom or for how much |
| The Zswap shielded coin moved during settlement/claim | PRIVATE amount and owner; but the **specific coin object's commitment linkage is disclosed** | Verified directly against the compiler (2026-09-12): calling `receiveShielded`/`sendShielded` requires an explicit `disclose()` because it links the receive/spend event to that coin's commitment. Amount and token color still never appear in ledger state (they're never written there in the first place), but an observer who already knows which coin commitment was involved can correlate that specific transfer across the transaction graph. This is Zswap's own accounting boundary, not a gap this contract introduces or could remove. |
| "Invoice was paid before its deadline" | SELECTIVELY DISCLOSED (Wave 2) | Provable via a presentation proof over `receiptCommitment` + `expiry` without revealing amount or metadata |
| "This receipt corresponds to a legitimate settlement" | SELECTIVELY DISCLOSED (Wave 2) | Same mechanism |
| Merchant-authored invoice notes / line items | OFF-CHAIN ENCRYPTED (in Wave 1: embedded only in the encrypted payment-link payload; no server involved) | Never touches the chain at all; only its hash is folded into the commitment |

## What this buys, honestly

- **Amount privacy is achievable**, not aspirational: `amount` never appears in any
  ledger field, and the actual value transfer happens through Zswap's shielded pool
  (`receiveShielded`/`sendShielded`), which hides the transferred amount at the
  network level independent of what this contract does. This claim depends on the
  verification item tracked in `docs/TOOLCHAIN.md` and `docs/BUILD_STATUS.md`
  regarding `ShieldedCoinInfo` internals — if that verification finds a gap, this
  document will be corrected, not silently left wrong.
- **Unlinkability across invoices** is partial in Wave 1: `merchantCommitment` is
  reused across a merchant's invoices (by design, so cancel-authorization keys off a
  single stable identity), so an observer who somehow learns two invoices share the
  same `merchantCommitment` can infer they're from the same merchant, but not the
  merchant's real identity or invoice contents. Payer-side unlinkability across
  separate payments is currently only as strong as Zswap's own nullifier design;
  claiming full unlinkability without further verification would be dishonest, so
  Wave 1 doesn't claim it.
- **No amount range proofs** in Wave 1 (e.g. "amount is between $X and $Y" without
  revealing it exactly) — not because Compact can't theoretically express range
  constraints, but because Wave 1 doesn't need it and it isn't verified/built yet.
  Tracked as Wave 2 scope alongside selective disclosure generally.
