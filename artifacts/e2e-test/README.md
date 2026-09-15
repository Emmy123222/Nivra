# End-to-end verification

The production Next.js application was exercised in headless Chromium against
`http://127.0.0.1:3000`.

## Result

- Browser: **31/31 checks passed**, zero uncaught page/console errors.
- Contract simulator: **21/21 tests passed**.
- SDK: **26/26 tests passed**.
- Web typecheck, ESLint, and production Webpack build passed.
- `npm audit`: **0 vulnerabilities**.
- Protocol demo passed create → verify → atomic settlement → receipt → unauthorized rejection → expiry.

The connected browser scenario uses a DApp Connector-compatible mock only for the
extension handshake and wallet boundary. It loads the real compiled verifier/ZKIR,
constructs the real deployment transaction, and intentionally stops when the mock
wallet cannot produce a valid balanced/proved transaction. A successful Preprod
submission requires an unlocked wallet approval and reachable wallet-selected network
services.

## Files

- `browser-report.json` — structured E2E results.
- `screenshots/` — rendered desktop/mobile/connected-state evidence.
- `verification.txt` — exact commands, outputs, and exit statuses.
- `baseline-commit.txt` / `baseline-sha256.txt` — preserved original identity.
- `e2e-fixes.patch` — complete source patch.
- `rollback.sh` — runnable reverse patch and optional verification.
