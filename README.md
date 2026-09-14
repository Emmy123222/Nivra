# Nivra

Privacy-first invoicing and payment settlement, built natively on the Midnight
Network. Codename `Nivra` pending a final project name.

Nivra lets a merchant create an invoice whose amount, line items, and customer
identity never touch the public ledger, share it as a payment link/QR code, and get
paid through a real Zswap shielded transfer that the Compact contract verifies before
flipping the invoice to `PAID` — all without a backend, a database, or a trusted
intermediary.

## Why this needs Midnight

A fully public chain makes every invoice amount and customer relationship
permanently visible the moment a payment happens. A traditional payment processor
protects that data but requires trusting a central company with it instead. Midnight's
dual-ledger model — public ledger state plus private, witness-derived client state,
with `disclose()` as an explicit, compiler-enforced boundary — is what lets this
project prove "this invoice was paid, by someone entitled to pay it, before its
deadline, to the right merchant" without publishing the amount, the parties, or the
line items. See `docs/PRIVACY_MODEL.md` for the exact field-by-field reasoning.

## Status

Wave 1 is functionally complete against `docs/WAVE1_SCOPE.md`, with the honest
caveats stated throughout `docs/BUILD_STATUS.md`. The Compact contract
(`contracts/src/invoice_registry.compact`, 5 circuits: create, cancel, settle, claim
settlement, mark expired) compiles cleanly and is covered by 24 passing circuit-level
tests, including two real correctness gaps found and fixed during development rather
than after (a missing coin-to-invoice binding in settlement claims, and a missing
zero-amount guard) — see `docs/SECURITY_REVIEW.md` for the full attacker-first pass
performed before calling Wave 1 done. The SDK (`packages/sdk`, 22 passing tests)
provides commitment verification, payment links, receipt links, DApp Connector wallet
connection, and contract deployment/circuit-call wiring — all typechecked against the
real installed Midnight packages, with the commitment/receipt logic additionally
cross-checked byte-for-byte against the real compiled contract. The frontend
(`apps/web`, Next.js 16) implements the full Wave 1 golden-path UI wired to real SDK
logic — all 6 routes verified error-free in a real headless browser, including
end-to-end payment-link and receipt-link verification passes and an honest "no wallet
found" failure path — with real settlement explicitly gated behind a clear message
rather than faked, since no live network/wallet is reachable in this development
environment. See `docs/BUILD_STATUS.md` for the authoritative, honest per-component
status — nothing there is marked done unless it actually runs, or tested unless it
has an automated test.

## Documentation

- [`docs/TOOLCHAIN.md`](docs/TOOLCHAIN.md) — exact pinned Midnight toolchain versions
  and why
- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — problem, personas, MVP, roadmap
- [`docs/PRIVACY_MODEL.md`](docs/PRIVACY_MODEL.md) — every field, classified and
  justified
- [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) — actors, properties, per-operation
  analysis
- [`docs/PROTOCOL_ARCHITECTURE.md`](docs/PROTOCOL_ARCHITECTURE.md) — dual-ledger
  architecture, commitment schemes, settlement design
- [`docs/STATE_MACHINE.md`](docs/STATE_MACHINE.md) — invoice lifecycle
- [`docs/INVARIANTS.md`](docs/INVARIANTS.md) — protocol invariants and how each is
  enforced
- [`docs/WAVE1_SCOPE.md`](docs/WAVE1_SCOPE.md) — what Wave 1 does and deliberately
  does not do
- [`docs/BUILD_STATUS.md`](docs/BUILD_STATUS.md) — live progress tracker
- [`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md) — attacker-first review,
  findings, and the Phase 27 attack-category checklist

## Repository layout

```
contracts/    Compact contract source and tests
packages/sdk/ TypeScript SDK: commitments, payment links, contract deploy/call wiring
apps/web/     Next.js frontend (merchant dashboard + checkout)
scripts/      demo.mjs — end-to-end protocol walkthrough via circuit simulation
docs/         Architecture, privacy, threat-model, and status documentation
```

There is no backend in Wave 1 — see `docs/PROTOCOL_ARCHITECTURE.md` for why that's a
deliberate choice, not an omission.

## Toolchain

Compact compiler `0.31.1`, pinned deliberately over the newer `0.34.0` because the
latter targets a release-candidate ledger the stable JS ecosystem doesn't yet match.
Full reasoning and every other pinned version: `docs/TOOLCHAIN.md`.

## License

Apache License 2.0 — see [`LICENSE`](LICENSE).
