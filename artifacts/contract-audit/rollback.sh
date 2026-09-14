#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${NIVRA_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
PATCH="$SCRIPT_DIR/contract.patch"
EXPECTED_MODIFIED="230aa98dcdbce9b0466dcdf47b273649cdbe80886bdb7566c474dfaef80043b7"
EXPECTED_BASELINE="f7b80fe5b62dfbb5be11e97f43a77052f05c14f0b8adba6711a52dc1a57c5db6"
CONTRACT="$ROOT/contracts/src/invoice_registry.compact"

actual="$(sha256sum "$CONTRACT" | cut -d' ' -f1)"
if [[ "$actual" != "$EXPECTED_MODIFIED" ]]; then
  echo "rollback aborted: contract hash is $actual, expected $EXPECTED_MODIFIED" >&2
  exit 2
fi

git -C "$ROOT" apply --check -R "$PATCH"
git -C "$ROOT" apply -R "$PATCH"
restored="$(sha256sum "$CONTRACT" | cut -d' ' -f1)"
if [[ "$restored" != "$EXPECTED_BASELINE" ]]; then
  echo "rollback verification failed: restored hash is $restored" >&2
  exit 3
fi

if [[ "${NIVRA_ROLLBACK_SKIP_BUILD:-0}" != "1" ]]; then
  npm --prefix "$ROOT" run compact --workspace=contracts
  npm --prefix "$ROOT" run build --workspace=contracts
  npm --prefix "$ROOT" run build --workspace=@nivra/sdk
  npm --prefix "$ROOT" run build --workspace=apps/web
fi

echo "rollback verified: $CONTRACT restored to $EXPECTED_BASELINE"
