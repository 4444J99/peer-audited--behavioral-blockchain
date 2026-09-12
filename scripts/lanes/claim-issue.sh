#!/usr/bin/env bash
#
# scripts/lanes/claim-issue.sh
#
# Marks an issue as claimed by an agent in docs/triage.json, setting state to BUILD_STARTED.
#
# Usage:
#   scripts/lanes/claim-issue.sh <issue-number> [agent-id]
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <issue-number> [agent-id]" >&2
  exit 1
fi

ISSUE_NUM="$1"
AGENT_ID="${2:-agent-$(git config user.name 2>/dev/null || echo "remote")}"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
TRIAGE_FILE="$ROOT/docs/triage.json"

if [ ! -f "$TRIAGE_FILE" ]; then
  echo "ERROR: docs/triage.json not found!" >&2
  exit 1
fi

echo "=== Claiming Issue #$ISSUE_NUM for $AGENT_ID ==="

node -e '
const fs = require("fs");
const file = process.argv[1];
const issueNum = process.argv[2];
const agentId = process.argv[3];
const ts = process.argv[4];

const triage = JSON.parse(fs.readFileSync(file, "utf8"));
if (!triage.issues[issueNum]) {
  console.log("Creating new entry in triage.json for issue #" + issueNum);
  triage.issues[issueNum] = {
    title: "Issue #" + issueNum,
    state: "BUILD_STARTED",
    action: "BUILD",
    batch: null,
    history: [],
    labels: [],
    pr: null,
    evidence: null,
    state_updated: ts
  };
}

const iss = triage.issues[issueNum];
const fromState = iss.state || "UNREAD";
iss.state = "BUILD_STARTED";
iss.action = "BUILD";
iss.claimed_by = agentId;
iss.state_updated = ts;
if (!iss.history) iss.history = [];
iss.history.push({
  from: fromState,
  to: "BUILD_STARTED",
  at: ts,
  agent: agentId
});

fs.writeFileSync(file, JSON.stringify(triage, null, 2));
console.log("Issue #" + issueNum + " state transitioned: " + fromState + " -> BUILD_STARTED (Claimed by " + agentId + ")");
' "$TRIAGE_FILE" "$ISSUE_NUM" "$AGENT_ID" "$TIMESTAMP"

echo "Issue #$ISSUE_NUM claimed successfully."
