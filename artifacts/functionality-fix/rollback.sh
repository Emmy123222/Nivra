#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$repo_root"
patch="artifacts/functionality-fix/changes.patch.gz"
gzip -dc "$patch" | git apply --check --reverse -
gzip -dc "$patch" | git apply --reverse -
echo "Restored source tree to baseline $(cat artifacts/functionality-fix/baseline-commit.txt)"
