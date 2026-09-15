# Lace compatibility fix

The reported connection failure occurred after Lace approved the popup because the
connected wallet object did not implement the advisory `hintUsage` method. Provider
setup now feature-detects that capability and proceeds using the core v4 methods.

The browser test intentionally supplies a connector without `hintUsage` and verifies
that the UI reaches `Wallet connected`, loads compiled ZK assets, reads balances, and
has zero uncaught browser errors. Payment-link decoding also preserves connector-
encoded merchant keys rather than assuming those strings are raw hex.

- `lace-compatibility.patch` — source and test patch.
- `verification.txt` — exact executed checks and outputs.
- `rollback.sh` — runnable reverse patch.
- `baseline-commit.txt` / `baseline-sha256.txt` — preserved baseline identity.
