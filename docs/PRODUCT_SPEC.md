# Product Specification — Nivra

Nivra (temporary codename; replace with `[PROJECT_NAME]` when finalized) is
privacy-preserving commerce infrastructure built natively on Midnight: private
invoicing, checkout, payment settlement, and cryptographic receipts.

## Problem

Payment infrastructure today forces a choice between two bad options: fully
transparent public blockchains, where every invoice amount, customer relationship,
and business detail becomes permanently public the moment a payment happens; or fully
custodial payment processors (Stripe-like), which see and can leak or misuse every
transaction detail and require trusting a central company. Neither protects a
merchant's commercial relationships, a customer's purchase history, or the contents of
what was actually bought — while still allowing anyone to verify that a payment
protocol behaved correctly.

## Why Midnight, specifically

Midnight's dual-ledger architecture (public ledger state + private, witness-derived
client state, with circuits that can selectively `disclose()` only what's required) is
the first environment where "an invoice was paid, by someone entitled to pay it, for
the correct amount, before its deadline" can be verified by anyone, while the amount,
the buyer's identity, the line items, and internal notes stay private by default. Any
other architecture (public chain, or trusted backend) requires giving up one side of
that: either privacy or verifiability. Removing Midnight's private-state and shielded
payment primitives from this design does not degrade it cosmetically — it removes the
product's core value proposition, since invoicing on a fully public ledger already
exists and isn't interesting.

## Personas

- **Merchant** — a freelancer, small business, or organization that wants to invoice
  and get paid without publishing its client list, pricing, or transaction volume to
  the world.
- **Customer / Payer** — someone who received a payment link and wants to pay without
  their purchase becoming part of a public, permanent, cross-referenceable ledger.
- **Developer** (Wave 2+) — someone integrating Nivra checkout into their own app or
  service.

## Core value proposition

Verifiable settlement without needless disclosure: the chain proves an invoice exists,
was paid by a legitimate transfer, before its deadline, to the right merchant — and
nothing else, unless the merchant or customer chooses to disclose more.

## User journeys

**Merchant** connects a Midnight wallet → creates an invoice (amount, currency,
optional private notes, expiry) → gets a shareable payment link + QR code → sees the
invoice's status (ACTIVE/PAID/CANCELLED/EXPIRED) in a dashboard → claims settled funds
→ can later show a customer's receipt is valid without revealing other customers'
invoices.

**Customer** opens a payment link → the invoice's private details are decoded
client-side from the link itself → the client recomputes the invoice commitment and
checks it exists on-chain (proving the merchant didn't send a link for something that
was never actually registered) → connects a wallet → pays via a real shielded transfer
→ receives a private receipt → can later prove "I paid this" without showing anyone
else's invoice or (beyond what's asked) their own purchase history.

**Developer** (Wave 2+): creates invoices and checks status programmatically, verifies
receipts, subscribes to settlement webhooks.

## MVP (Wave 1 golden path)

Merchant connects wallet → creates private invoice → contract registers commitment →
payment link/QR generated → customer opens checkout → invoice commitment verified
client-side → customer connects wallet → customer executes a real shielded payment →
contract verifies and flips invoice to PAID → private receipt commitment written →
merchant dashboard updates → merchant claims settled funds → receipt is verifiable.

## Non-goals (Wave 1)

Cards, gift cards, Telegram bot, AI agents, MCP, multi-token support beyond one
shielded token type, fiat on/off-ramp, recurring subscriptions, enterprise team
accounts, credit scoring, analytics beyond raw invoice counts/status, cross-chain
payments, native mobile apps, a backend/database, a developer API.

## Wave 1 scope

See `docs/WAVE1_SCOPE.md` for the authoritative, detailed scope and out-of-scope list.
In one line: one Compact contract, a minimal SDK, a minimal frontend, no backend —
prove the full private-invoice-to-settled-receipt loop end to end, for real, on
Preprod.

## Wave 2 roadmap

Hosted checkout, developer API + webhooks, SDK maturity, recurring invoices, richer
private receipts with selective-disclosure presentation proofs (e.g. "paid before
deadline" without revealing the amount), multiple payment links per invoice, merchant
analytics, additional shielded token support.

## Wave 3 roadmap

Private subscriptions, enterprise merchant accounts with team permissions, expense
management, programmable/policy receipts, compliance proofs, merchant financial
credentials, advanced SDK, external integrations, production deployment hardening.
