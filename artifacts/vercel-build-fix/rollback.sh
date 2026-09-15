#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET_ROOT="${1:-$SOURCE_ROOT}"

cp "$SOURCE_ROOT/artifacts/vercel-build-fix/original/gitignore" "$TARGET_ROOT/.gitignore"
cp "$SOURCE_ROOT/artifacts/vercel-build-fix/original/apps-web-package.json" "$TARGET_ROOT/apps/web/package.json"

managed="$TARGET_ROOT/contracts/src/managed"
if [ -d "$managed" ]; then
  test ! -e "$managed.rolled-back"
  mv "$managed" "$managed.rolled-back"
fi

printf 'restored hosted-build baseline under %s\n' "$TARGET_ROOT"
