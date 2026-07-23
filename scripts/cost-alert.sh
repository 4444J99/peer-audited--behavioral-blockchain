#!/usr/bin/env bash
# Cost alerting script for Styx Render deployment.
# Checks current spending against thresholds and sends notifications.
# Can be run via cron or scheduled Render Cron Jobs.
#
# Usage:
#   export RENDER_API_KEY="rnd_xxx"
#   export RENDER_OWNER_ID="team_xxx"
#   ./scripts/cost-alert.sh [--threshold 50] [--slack-webhook URL]

set -euo pipefail

THRESHOLD=50         # Default: alert if monthly cost exceeds $50
SLACK_WEBHOOK=""
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --threshold) THRESHOLD="$2"; shift 2 ;;
    --slack-webhook) SLACK_WEBHOOK="$2"; shift 2 ;;
    --verbose) VERBOSE=true; shift ;;
    *) echo "Usage: $0 [--threshold 50] [--slack-webhook URL] [--verbose]"; exit 1 ;;
  esac
done

if [ -z "${RENDER_API_KEY:-}" ]; then
  echo "FAIL: RENDER_API_KEY not set"
  echo "  Get one at https://dashboard.render.com/u/settings/api-keys"
  exit 1
fi

BASE_URL="https://api.render.com/v1"

# Fetch owners/services to calculate estimated monthly cost
echo "=== Cost Alert Check ==="

OWNERS=$(curl -sf -H "Authorization: Bearer $RENDER_API_KEY" "$BASE_URL/owners" 2>/dev/null || echo '[]')
OWNER_COUNT=$(echo "$OWNERS" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))" 2>/dev/null || echo 0)

if [ "$OWNER_COUNT" -eq 0 ]; then
  echo "WARN: Could not fetch owner list — check RENDER_API_KEY permissions"
  exit 0
fi

# Get all services and their plans
SERVICES=$(curl -sf -H "Authorization: Bearer $RENDER_API_KEY" "$BASE_URL/services" 2>/dev/null || echo '[]')

ESTIMATED_COST=$(echo "$SERVICES" | python3 -c "
import json, sys
services = json.load(sys.stdin) if sys.stdin.read() else []
costs = {'starter': 7, 'standard': 22, 'pro': 85, 'professional': 85, 'free': 0}
total = 0
for s in services:
    plan = s.get('serviceDetails', {}).get('plan', 'free').lower()
    total += costs.get(plan, 0)
# Add DB costs (PostgreSQL free plan)
print(total)
" 2>/dev/null || echo 0)

echo "Estimated monthly cost: \$${ESTIMATED_COST}.00"
echo "Threshold: \$${THRESHOLD}.00"

if [ "$ESTIMATED_COST" -gt "$THRESHOLD" ]; then
  MESSAGE="⚠️  Cost alert: Styx estimated monthly spend is \$${ESTIMATED_COST} (threshold: \$${THRESHOLD})"
  echo "ALERT: $MESSAGE"

  if [ -n "$SLACK_WEBHOOK" ]; then
    curl -sf -X POST -H "Content-Type: application/json" \
      -d "{\"text\":\"$MESSAGE\"}" \
      "$SLACK_WEBHOOK" >/dev/null && echo "  Slack notification sent"
  fi
else
  echo "OK: Under threshold (under by \$((THRESHOLD - ESTIMATED_COST)).00)"
fi
