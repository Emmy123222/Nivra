#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ART="$ROOT/artifacts/wallet-picker"
cp "$ART/original/sdk-wallet.ts" "$ROOT/packages/sdk/src/wallet.ts"
cp "$ART/original/wallet-context.tsx" "$ROOT/apps/web/src/lib/wallet-context.tsx"
cp "$ART/original/browser-e2e.mjs" "$ROOT/tests/e2e/browser-e2e.mjs"
python3 - "$ROOT/apps/web/src/components/wallet-picker.tsx" <<'PY'
from pathlib import Path
import sys
Path(sys.argv[1]).unlink(missing_ok=True)
PY
sha256sum -c "$ART/baseline-sha256.txt"
