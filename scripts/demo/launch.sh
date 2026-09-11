#!/usr/bin/env bash
# Backward-compatible entry point for the single canonical demo launcher.
# The canonical launcher probes, reports, and opens the same /tour URL; keeping
# that contract in one script prevents the blank-browser split tracked in #937.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec bash "$repo_root/scripts/demo/launch-canonical.sh" "$@"
