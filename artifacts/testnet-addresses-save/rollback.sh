#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
SOURCE="$ROOT/docs/TESTNET_ADDRESSES.md"
BACKUP="$ROOT/docs/TESTNET_ADDRESSES.md.rolled-back"
test -f "$SOURCE"
test ! -e "$BACKUP"
mv "$SOURCE" "$BACKUP"
printf 'moved %s to %s\n' "$SOURCE" "$BACKUP"
