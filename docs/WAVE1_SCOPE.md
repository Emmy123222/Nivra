# Wave 1 Scope

## Golden path (the entire product, for Wave 1)

Merchant connects wallet → creates private invoice → contract registers commitment →
payment link/QR generated → customer opens checkout → client verifies invoice
commitment → customer connects wallet → customer executes a real shielded payment →
contract verifies settlement and atomically routes funds to the merchant → invoice
becomes PAID → private receipt generated → merchant dashboard updates → receipt can
be verified.

## In scope

- One Compact contract: `InvoiceRegistry` (`contracts/src/invoice_registry.compact`),
  plus a small `types.compact`/`crypto.compact` if the main contract benefits from
  splitting out shared struct/hash-domain definitions — not introduced speculatively.
- Circuits: `createInvoice`, `cancelInvoice`, `settleInvoice`, `markExpired`.
- One supported shielded token type per invoice (`tokenColor` is a preimage field;
  multiple *types* of token are not specially handled beyond that).
- `packages/sdk`: `connectWallet` (real, wraps the DApp Connector), `getInvoiceStatus`,
  `verifyInvoicePaymentLink` (the `verifyInvoice` of this list, specialized to a
  payment link), `verifyReceipt` (plus `receipt-link.ts` for a shareable,
  self-verifying receipt URL) — all implemented and tested. `createInvoice`,
  `settleInvoice` and `cancelInvoice` are satisfied by
  `deployedContract.callTx.<circuitName>(...)`, generic machinery from
  `midnight-js-contracts` verified against the real installed package rather than
  reimplemented as identically-named wrapper functions with no behavior of their
  own — see the file comment at the top of `packages/sdk/src/contract.ts` for the
  reasoning.
- `apps/web`: landing page, wallet connection, merchant dashboard (active / paid /
  expired / cancelled invoices, using only data actually available from the
  indexer), create-invoice form, invoice details, customer checkout, payment
  confirmation, receipt view.
- Automated contract tests (circuit simulation via `@midnight-ntwrk/compact-runtime`,
  per the environment limitation in `docs/TOOLCHAIN.md`) covering the invariants in
  `docs/INVARIANTS.md`.
- Apache License 2.0 on the repository.

## Explicitly out of scope for Wave 1

Backend/API/database, developer platform, webhooks, cards, gift cards, Telegram bot,
AI agents, MCP, multi-token-type-aware UI, fiat integration, recurring
subscriptions/invoices, enterprise team accounts, credit scoring, analytics beyond raw
invoice counts by status, cross-chain payments, native mobile apps, selective-
disclosure presentation proofs (receipt commitments are created and locally
verifiable in Wave 1; presenting a proof of "paid before deadline" to a third party
without revealing the invoice is Wave 2).

## Priority ordering (explicit, per the project's own rule)

COMPLETE over LARGE. SECURE over FEATURE-RICH. WORKING over IMPRESSIVE-LOOKING. If a
tradeoff has to be made under time pressure, cut a UI screen before cutting a contract
guard, and cut a feature before shipping an unverified Midnight API assumption.
