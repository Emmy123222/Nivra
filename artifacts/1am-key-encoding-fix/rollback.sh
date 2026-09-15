#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET_ROOT="${1:-$SOURCE_ROOT}"

restore() {
  local path="$1"
  mkdir -p "$TARGET_ROOT/$(dirname "$path")"
  cp "$SOURCE_ROOT/artifacts/1am-key-encoding-fix/original/$path" "$TARGET_ROOT/$path"
}

restore apps/web/src/lib/wallet-context.tsx
restore package-lock.json
restore packages/sdk/package.json
restore packages/sdk/src/contract.ts
restore packages/sdk/src/payment-link.ts
restore packages/sdk/src/wallet.ts
restore tests/e2e/browser-e2e.mjs

new_test="$TARGET_ROOT/packages/sdk/src/test/wallet.test.ts"
if [ -f "$new_test" ]; then
  test ! -e "$new_test.rolled-back"
  mv "$new_test" "$new_test.rolled-back"
fi

printf 'restored 1AM key-encoding baseline under %s\n' "$TARGET_ROOT"
