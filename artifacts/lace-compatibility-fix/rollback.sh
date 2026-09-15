#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PATCH="$ROOT/artifacts/lace-compatibility-fix/lace-compatibility.patch"
cd "$ROOT"
git apply --check --reverse "$PATCH"
git apply --reverse "$PATCH"
if [[ "${NIVRA_ROLLBACK_INSTALL:-0}" == "1" ]]; then npm install; fi
if [[ "${NIVRA_ROLLBACK_VERIFY:-1}" == "1" ]]; then
  npm test
  npm run typecheck --workspace=apps/web
  npm run lint --workspace=apps/web
  npm run build --workspace=apps/web
fi
echo "Lace compatibility fix rolled back to $(cat artifacts/lace-compatibility-fix/baseline-commit.txt)."
