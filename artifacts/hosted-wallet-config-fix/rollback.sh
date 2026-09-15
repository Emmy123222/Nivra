#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET_ROOT="${1:-$SOURCE_ROOT}"

mkdir -p "$TARGET_ROOT/apps/web/src/lib" "$TARGET_ROOT/tests/e2e"
cp "$SOURCE_ROOT/artifacts/hosted-wallet-config-fix/original/apps/web/src/lib/providers.ts" "$TARGET_ROOT/apps/web/src/lib/providers.ts"
cp "$SOURCE_ROOT/artifacts/hosted-wallet-config-fix/original/tests/e2e/browser-e2e.mjs" "$TARGET_ROOT/tests/e2e/browser-e2e.mjs"

printf 'restored hosted wallet-configuration baseline under %s\n' "$TARGET_ROOT"
