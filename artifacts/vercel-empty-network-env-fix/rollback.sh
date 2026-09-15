#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ART="$ROOT/artifacts/vercel-empty-network-env-fix"
cp "$ART/original/network.ts" "$ROOT/apps/web/src/lib/network.ts"
sha256sum -c "$ART/baseline-sha256.txt"
