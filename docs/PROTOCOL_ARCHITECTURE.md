# Protocol Architecture

```
                     Web Application (apps/web, Next.js)
                                   |
                     Midnight Wallet / DApp Connector
                          (Lace, dapp-connector-api ^4.0.1)
                                   |
                        TypeScript Client / SDK
                              (packages/sdk)
                                   |
                     Compact Contract: InvoiceRegistry
                                   |
                +------------------+------------------+
                |                                      |
         Public Ledger State                   Client Private State
    (contracts/src/invoice_registry.compact)   (witnesses: merchantSecret,
    - invoices: Map<Bytes<32>, InvoiceRecord>    payer secrets, amount,
    - receipts: Map<Bytes<32>, Bytes<32>>        tokenColor, metadataHash,
                                                  invoiceSecret, nonce)
                |
                v
        Indexer (@midnight-ntwrk/midnight-js-indexer-public-data-provider)
     -> feeds the dashboard's invoice list/status view
```

## Layer responsibilities

### Blockchain (Compact contract)
- Registers invoice commitments.
- Enforces the lifecycle state machine (`docs/STATE_MACHINE.md`).
- Enforces merchant authorization via hash-preimage proof, never by comparing a
  caller-supplied commitment to itself.
- Ties settlement to a real Zswap shielded value transfer (`receiveShielded`).
- Atomically routes the transient settlement coin to the merchant payout key whose
  commitment was fixed when the invoice was created (`sendShielded`).
- Enforces expiry via `blockTimeLt/Gte`, never a caller-supplied timestamp.
- Registers receipt commitments at the moment of real settlement.
- This is the sole source of truth for "is this invoice PAID." Nothing else in the
  system — not the frontend, not the SDK — is trusted to assert that.

### Client private state
- Every secret: `merchantSecret`, `merchantNonce`, invoice `nonce`, `invoiceSecret`,
  `amount`, `tokenColor`, `metadataHash` preimage, payer settlement/receipt secrets.
- These are supplied to circuits as **witnesses** — callback functions the DApp
  provides, per Compact's witness model — and never appear in any transaction data
  that isn't explicitly `disclose()`d.
- The full invoice preimage plus a human-readable description of what's being paid
  for is what actually travels inside a fragment-only bearer payment link/QR code (encoded — see
  `docs/PAYMENT_LINKS` section below and Phase 20 handling in `WAVE1_SCOPE.md`).

### Backend
**None in Wave 1**, by deliberate design (see `docs/PRODUCT_SPEC.md`). The golden
path requires no server: invoice metadata travels in the payment link itself, wallet
interaction happens client-side via the DApp connector, and invoice status is read
directly from the indexer. A backend is reintroduced in Wave 2 specifically for
things that are genuinely server-shaped: webhooks, a developer API, and hosted
checkout — never as a trusted authority over settlement correctness, which always
remains the contract's job.

## Invoice commitment

```
invoiceCommitment = persistentHash<...>(
  DOMAIN_INVOICE,      // domain-separation tag, distinct from DOMAIN_MERCHANT/DOMAIN_RECEIPT
  version,             // protocol version byte, allows future preimage-shape changes
  merchantCommitment,  // Bytes<32>, itself a hash — see below
  amount,              // Uint<128>
  tokenColor,          // Bytes<32>
  expiry,              // Uint<64>
  metadataHash,         // Bytes<32>, hash of off-chain notes/line items
  invoiceSecret,       // Bytes<32>, random — access-control / anti-enumeration
  nonce                // Bytes<32>, random — hiding even if every other field leaks
)
```

- **Entropy:** `nonce` and `invoiceSecret` are both merchant-generated 256-bit random
  values. Either alone is enough entropy to make the commitment computationally
  binding and hiding under `persistentHash`'s SHA-256 construction; having both
  serves two distinct purposes (hiding vs. anti-enumeration) rather than redundancy.
- **Collision assumption:** relies on SHA-256 collision resistance, the same
  assumption `persistentHash` itself is built on and documented to preserve across
  compiler upgrades (unlike `transientHash`, which is explicitly *not* upgrade-stable
  and is therefore never used for anything long-lived in this protocol).
- **Dictionary attacks:** without `nonce`/`invoiceSecret`, an attacker who knows a
  plausible (merchant, amount, expiry, metadataHash) tuple could brute-force it and
  learn the invoice's contents from the public commitment alone. The random secrets
  make that infeasible even for guessable business terms (e.g. round-number
  invoices).
- **Cross-protocol replay:** the `DOMAIN_INVOICE` tag ensures a hash computed for this
  purpose can never collide with a `DOMAIN_MERCHANT` or `DOMAIN_RECEIPT` hash, or with
  a commitment from an unrelated Midnight application using the same primitive.

## Merchant commitment

```
merchantCommitment = persistentHash<...>(DOMAIN_MERCHANT, merchantSecret, merchantNonce)
```

`merchantNonce` allows the same underlying `merchantSecret` to be reused across
identity contexts without linking them, if ever needed; for Wave 1 a merchant simply
generates one `(merchantSecret, merchantNonce)` pair and reuses it for every invoice
they create, giving them one stable on-chain identity without revealing anything
about who they are.

## Payment settlement strategy

Payer calls `settleInvoice` with the full invoice preimage (as witnesses) plus a real
owned Zswap shielded coin. In one circuit call, atomically:

1. Recompute `invoiceCommitment`; assert it exists in `invoices` and `state ==
   ACTIVE`.
2. Assert `blockTimeLt(expiry)`.
3. Assert the supplied coin's `color`/`value` match the preimage's `tokenColor`/
   `amount`.
4. Call `receiveShielded(coin)` and immediately consume that same output as a
   transient qualified coin (`mt_index = 0`) with `sendShielded` to the payout key
   whose commitment was fixed during invoice creation.
5. Flip `state` to `PAID`.
6. Write `receipts[invoiceCommitment] = persistentHash(DOMAIN_RECEIPT,
   invoiceCommitment, payerReceiptSecret)`.

The payment link carries the merchant's payout and encryption public keys. The
contract stores only a domain-separated commitment to the payout key and rejects a
substituted destination. Midnight.js receives the encryption-key mapping only to
construct the merchant-readable output. The contract never retains a spendable coin,
so there is no custodial withdrawal, coin-index discovery, or double-claim surface.

This mechanism, and the exact shape of `ShieldedCoinInfo`/`QualifiedShieldedCoinInfo`,
has been verified directly against the installed Compact compiler and
`@midnight-ntwrk/compact-runtime` 0.16.0 (not just documentation) — see
`docs/TOOLCHAIN.md`. What remains unverified is behavior against a real deployed
network (real proof server, real wallet, real chain state) rather than circuit
simulation — tracked in `docs/BUILD_STATUS.md`.

## Payment links and QR codes

A payment link encodes the full invoice preimage plus a short human-readable
description, authenticated-encrypted (Wave 1: no server, so the encryption key is
either embedded in the link's fragment (`#...`, never sent to a server on load) or the
link is shared through an already-secure channel and contains the plaintext preimage
directly — both options and their tradeoffs are documented for the frontend
implementation phase rather than decided prematurely here). What's non-negotiable
regardless of which option ships: no raw secret is placed in the URL **path or query
string** (which browsers/servers/proxies commonly log); if a payload is embedded, it
goes in the fragment, which is never sent over the network by a browser. A QR code is
simply a rendering of the same link — it introduces no new protocol behavior.
