#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PATCH="$ROOT/artifacts/e2e-test/e2e-fixes.patch"
cd "$ROOT"
git apply --check --reverse "$PATCH"
git apply --reverse "$PATCH"
if [[ "${NIVRA_ROLLBACK_INSTALL:-1}" == "1" ]]; then
  npm install
fi
if [[ "${NIVRA_ROLLBACK_VERIFY:-1}" == "1" ]]; then
  npm test
  npm run typecheck --workspace=apps/web
  npm run lint --workspace=apps/web
  npm run build --workspace=apps/web
fi
echo "Rolled back E2E hardening patch to baseline $(cat artifacts/e2e-test/baseline-commit.txt)."
