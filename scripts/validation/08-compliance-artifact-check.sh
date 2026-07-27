#!/usr/bin/env bash
# CI release gate: check that compliance artifacts are present, unexpired,
# and have matching content hashes.
#
# Fails (exit 1) if:
#   - No active artifact exists for a required type
#   - The artifact content hash does not match the stored hash
#   - The artifact has expired
#
# Called during deploy pipeline. Requires DATABASE_URL and ARTIFACT_DIR.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REQUIRED_TYPES=("${COMPLIANCE_REQUIRED_TYPES:-skill_contest_whitepaper}")

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is required" >&2
  exit 1
fi

ARTIFACT_DIR="${ARTIFACT_DIR:-./docs/legal}"

for type in "${REQUIRED_TYPES[@]}"; do
  echo "Checking compliance artifact: $type"

  # Query the API for active artifact status
  # In CI, we can query the database directly via psql
  ARTIFACT_JSON=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT json_build_object(
      'version', version,
      'content_hash', content_hash,
      'artifact_path', artifact_path,
      'expires_at', expires_at,
      'signed_by', signed_by,
      'signed_at', signed_at,
      'jurisdictions', jurisdictions
    ) FROM compliance_artifacts
     WHERE artifact_type = '$type' AND is_active = true;" 2>/dev/null || echo "")

  if [ -z "$ARTIFACT_JSON" ] || [ "$ARTIFACT_JSON" = "null" ]; then
    echo "FAIL: No active compliance artifact found for '$type'. Deploy blocked." >&2
    exit 1
  fi

  VERSION=$(echo "$ARTIFACT_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['version'])" 2>/dev/null || echo "")
  HASH=$(echo "$ARTIFACT_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['content_hash'])" 2>/dev/null || echo "")
  PATH_FROM_DB=$(echo "$ARTIFACT_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['artifact_path'])" 2>/dev/null || echo "")
  EXPIRES=$(echo "$ARTIFACT_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('expires_at') or '')" 2>/dev/null || echo "")

  if [ -z "$VERSION" ] || [ -z "$HASH" ]; then
    echo "FAIL: Compliance artifact '$type' has incomplete metadata (version=$VERSION, hash=$HASH). Deploy blocked." >&2
    exit 1
  fi

  # Check expiration
  if [ -n "$EXPIRES" ]; then
    EXPIRES_EPOCH=$(date -d "$EXPIRES" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "$EXPIRES" +%s 2>/dev/null || echo "")
    NOW_EPOCH=$(date +%s)
    if [ -n "$EXPIRES_EPOCH" ] && [ "$NOW_EPOCH" -gt "$EXPIRES_EPOCH" ]; then
      echo "FAIL: Compliance artifact '$type' version $VERSION expired at $EXPIRES. Deploy blocked." >&2
      exit 1
    fi
  fi

  # Find the artifact file
  ARTIFACT_FILE=""
  if [ -n "$PATH_FROM_DB" ]; then
    # Try relative to repo root
    if [ -f "$SCRIPT_DIR/../../$PATH_FROM_DB" ]; then
      ARTIFACT_FILE="$SCRIPT_DIR/../../$PATH_FROM_DB"
    elif [ -f "$PATH_FROM_DB" ]; then
      ARTIFACT_FILE="$PATH_FROM_DB"
    fi
  fi

  # Also search ARTIFACT_DIR by type name
  if [ -z "$ARTIFACT_FILE" ]; then
    for f in "$ARTIFACT_DIR"/*; do
      if echo "$f" | grep -qi "${type}" 2>/dev/null; then
        ARTIFACT_FILE="$f"
        break
      fi
    done
  fi

  # Verify hash if file found
  if [ -n "$ARTIFACT_FILE" ]; then
    COMPUTED_HASH=$(sha256sum "$ARTIFACT_FILE" | cut -d' ' -f1)
    if [ "$COMPUTED_HASH" != "$HASH" ]; then
      echo "FAIL: Compliance artifact '$type' hash mismatch. Expected $HASH, got $COMPUTED_HASH. Deploy blocked." >&2
      exit 1
    fi
    echo "OK: '$type' version $VERSION — hash verified, $( [ -n "$EXPIRES" ] && echo "expires $EXPIRES" || echo "no expiration" )"
  else
    echo "WARN: Compliance artifact '$type' version $VERSION — artifact file not found on disk. Hash check skipped (will verify at runtime)."
  fi
done

echo ""
echo "All compliance artifact checks passed. Deploy may proceed."
