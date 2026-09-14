# Invoice State Machine

```
                 createInvoice()
                       |
                       v
                  +---------+
          +-------|  ACTIVE |-------+
          |       +---------+       |
   settleInvoice() |      | cancelInvoice()
          |         markExpired()   |
          v         |               v
      +------+      v          +-----------+
      | PAID |  +---------+    | CANCELLED |
      +------+  | EXPIRED |    +-----------+
                 +---------+
```

`PAID`, `CANCELLED`, and `EXPIRED` are terminal. There is no `CREATED` state distinct
from `ACTIVE` in the implementation: `createInvoice` performs commitment registration
and the CREATED→ACTIVE transition atomically in one circuit call, because there is no
useful intermediate state between "just created" and "available to be paid" — Compact
transactions are all-or-nothing, so there's nothing for a separate CREATED state to
protect against.

## Explicitly forbidden transitions

`PAID → ACTIVE`, `CANCELLED → ACTIVE`, `EXPIRED → ACTIVE`, `CANCELLED → PAID`,
`EXPIRED → PAID`, `PAID → PAID` (double settlement), `PAID → CANCELLED`. Every
mutating circuit (`cancelInvoice`, `settleInvoice`, `markExpired`) begins with an
`assert(state == ACTIVE, ...)` guard — there is no code path in any circuit that
writes a new state without that guard passing first. This is enforced by Compact at
the contract level; the frontend has no ability to influence it, per Phase 6's
explicit requirement that state correctness never depends on the UI.

## Transition table

| From | Event | To | Guard |
|---|---|---|---|
| (none) | `createInvoice` | `ACTIVE` | commitment not already present in `invoices` |
| `ACTIVE` | `settleInvoice` | `PAID` | commitment exists, `blockTimeLt(expiry)`, real `receiveShielded` of matching value/color succeeds, and the transient coin is sent to the committed merchant payout key |
| `ACTIVE` | `cancelInvoice` | `CANCELLED` | `merchantSecret` proof matches stored `merchantCommitment` |
| `ACTIVE` | `markExpired` | `EXPIRED` | `blockTimeGte(expiry)` (permissionless — anyone may trigger this once it's true) |
| `PAID`/`CANCELLED`/`EXPIRED` | any | (rejected) | terminal-state guard fails |

## Why `markExpired` is a separate, permissionless circuit

Compact has no way to proactively run code when a deadline passes — state only
changes in response to a transaction. Rather than silently treating "expiry passed"
as an implicit state everywhere (which would require every reader to independently
recompute it, and would be easy to get subtly wrong in the frontend), `markExpired`
lets *anyone* pay the small transaction cost to formally close out an expired invoice
on-chain once, after which its state is unambiguous to every future reader. Until
someone calls it, `settleInvoice` on a past-deadline invoice still correctly fails
(via its own `blockTimeLt(expiry)` check) — `markExpired` is a convenience for clean
state, not a security boundary.
