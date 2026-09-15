#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ART="$ROOT/artifacts/hosted-wallet-rpc-order-fix"
cp "$ART/original/providers.ts" "$ROOT/apps/web/src/lib/providers.ts"
cp "$ART/original/browser-e2e.mjs" "$ROOT/tests/e2e/browser-e2e.mjs"
sha256sum -c "$ART/baseline-sha256.txt"
