#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ART="$ROOT/artifacts/wallet-balance-fallback-fix"
cp "$ART/original/create-page.tsx" "$ROOT/apps/web/src/app/dashboard/create/page.tsx"
cp "$ART/original/checkout-page.tsx" "$ROOT/apps/web/src/app/checkout/page.tsx"
cp "$ART/original/browser-e2e.mjs" "$ROOT/tests/e2e/browser-e2e.mjs"
sha256sum -c "$ART/baseline-sha256.txt"
