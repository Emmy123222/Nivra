#!/usr/bin/env bash
set -euo pipefail
ROOT="${ROOT:-/home/emmanuel-ogheneovo/nivra}"
ARTIFACT_DIR="/home/emmanuel-ogheneovo/nivra/artifacts/payment-progress-fix/original"
install -D "$ARTIFACT_DIR/apps/web/src/app/checkout/page.tsx" "$ROOT/apps/web/src/app/checkout/page.tsx"
install -D "$ARTIFACT_DIR/apps/web/src/app/dashboard/create/page.tsx" "$ROOT/apps/web/src/app/dashboard/create/page.tsx"
install -D "$ARTIFACT_DIR/apps/web/src/lib/providers.ts" "$ROOT/apps/web/src/lib/providers.ts"
install -D "$ARTIFACT_DIR/packages/sdk/src/contract.ts" "$ROOT/packages/sdk/src/contract.ts"
install -D "$ARTIFACT_DIR/packages/sdk/src/test/contract.test.ts" "$ROOT/packages/sdk/src/test/contract.test.ts"
