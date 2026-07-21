#!/usr/bin/env bash
set -euo pipefail

echo "=== Push Notification Setup Verification ==="

# Check environment variables
check_var() {
  if [ -z "$(printenv "${1:-}" 2>/dev/null)" ]; then
    echo "FAIL: $1 is not set"
    exit 1
  fi
  echo "PASS: $1 is set"
}

check_var EXPO_ACCESS_TOKEN
check_var EXPO_PROJECT_ID

# Check Expo API reachability
echo -n "Checking Expo push API endpoint... "
if curl -sf -o /dev/null --max-time 5 "https://exp.host/--/api/v2/push/getExpoPushToken" 2>/dev/null; then
  echo "reachable"
else
  echo "FAIL: Expo push API not reachable"
  echo "  Check network connectivity or proxy settings"
  exit 1
fi

echo ""
echo "=== All checks passed ==="
