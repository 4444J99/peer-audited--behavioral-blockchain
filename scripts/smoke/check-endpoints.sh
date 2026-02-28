#!/usr/bin/env bash
set -euo pipefail

# Endpoint smoke test — validates critical API routes respond correctly.
# Called by staging-smoke.sh and beta-smoke.sh after readiness check.

: "${API_URL:?API_URL is required}"

API_URL="${API_URL%/}"
PASS=0
FAIL=0
WARN=0

tmp_body="$(mktemp)"
cleanup() { rm -f "$tmp_body"; }
trap cleanup EXIT

check() {
  local label="$1"
  local method="$2"
  local url="$3"
  local expected_code="$4"
  shift 4
  local extra_args=("$@")

  http_code="$(curl -sS -o "$tmp_body" -w "%{http_code}" \
    -X "$method" "${extra_args[@]}" "$url" 2>/dev/null || echo "000")"

  if [ "$http_code" = "$expected_code" ]; then
    echo "  ✅ ${label} → HTTP ${http_code}"
    PASS=$((PASS + 1))
  else
    echo "  ❌ ${label} → HTTP ${http_code} (expected ${expected_code})"
    FAIL=$((FAIL + 1))
  fi
}

check_body_contains() {
  local label="$1"
  local url="$2"
  local needle="$3"

  http_code="$(curl -sS -o "$tmp_body" -w "%{http_code}" "$url" 2>/dev/null || echo "000")"

  if [ "$http_code" != "200" ]; then
    echo "  ❌ ${label} → HTTP ${http_code} (expected 200)"
    FAIL=$((FAIL + 1))
    return
  fi

  if grep -qi "$needle" "$tmp_body" 2>/dev/null; then
    echo "  ✅ ${label} → HTTP 200, contains '${needle}'"
    PASS=$((PASS + 1))
  else
    echo "  ⚠️  ${label} → HTTP 200 but missing '${needle}'"
    WARN=$((WARN + 1))
  fi
}

echo ""
echo "═══════════════════════════════════════════"
echo "  Styx Endpoint Smoke Test"
echo "  Target: ${API_URL}"
echo "═══════════════════════════════════════════"
echo ""

# ── Health ──
echo "Health & Meta"
check "GET /health"        GET "${API_URL}/health"       200
check "GET /health/ready"  GET "${API_URL}/health/ready"  200

# ── Auth guards (unauthenticated requests should be rejected) ──
echo ""
echo "Auth Guards (expect 401 for unauthenticated requests)"
check "GET /contracts"        GET  "${API_URL}/contracts"        401
check "GET /wallet/balance"   GET  "${API_URL}/wallet/balance"   401
check "GET /users/me"         GET  "${API_URL}/users/me"         401
check "GET /notifications"    GET  "${API_URL}/notifications"    401
check "GET /fury/queue"       GET  "${API_URL}/fury/queue"       401

# ── Auth endpoints (validation errors, not 500s) ──
echo ""
echo "Auth Endpoints (expect 400/401 for invalid input, not 500)"
check "POST /auth/login empty body" \
  POST "${API_URL}/auth/login" 400 \
  -H "Content-Type: application/json" -d '{}'

check "POST /auth/login bad creds" \
  POST "${API_URL}/auth/login" 401 \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke-test-nonexistent@styx.test","password":"wrongPassword1!"}'

check "POST /auth/register missing fields" \
  POST "${API_URL}/auth/register" 400 \
  -H "Content-Type: application/json" -d '{}'

# ── Public endpoints ──
echo ""
echo "Public Endpoints"
check "GET /feed"             GET "${API_URL}/feed"             200
check "GET /users/leaderboard" GET "${API_URL}/users/leaderboard" 200

# ── Rate limiting headers present ──
echo ""
echo "Rate Limiting"
rate_headers="$(curl -sS -I "${API_URL}/health" 2>/dev/null || true)"
if echo "$rate_headers" | grep -qi "x-ratelimit\|retry-after\|ratelimit"; then
  echo "  ✅ Rate limit headers present"
  PASS=$((PASS + 1))
else
  echo "  ⚠️  No rate limit headers detected (may be behind reverse proxy)"
  WARN=$((WARN + 1))
fi

# ── Web legal pages (if WEB_URL set) ──
if [ -n "${WEB_URL:-}" ]; then
  WEB_URL="${WEB_URL%/}"
  echo ""
  echo "Web Legal Pages (${WEB_URL})"
  check_body_contains "GET /legal/terms"           "${WEB_URL}/legal/terms"           "Terms of Service"
  check_body_contains "GET /legal/privacy"         "${WEB_URL}/legal/privacy"         "Privacy Policy"
  check_body_contains "GET /legal/rules"           "${WEB_URL}/legal/rules"           "Contest Official Rules"
  check_body_contains "GET /legal/responsible-use" "${WEB_URL}/legal/responsible-use" "Responsible Use"
fi

# ── Summary ──
echo ""
echo "═══════════════════════════════════════════"
TOTAL=$((PASS + FAIL + WARN))
echo "  Results: ${PASS} passed, ${FAIL} failed, ${WARN} warnings (${TOTAL} checks)"
echo "═══════════════════════════════════════════"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "❌ Endpoint smoke test FAILED"
  exit 1
fi

if [ "$WARN" -gt 0 ]; then
  echo "⚠️  Endpoint smoke test PASSED with warnings"
  exit 0
fi

echo "✅ Endpoint smoke test PASSED"
exit 0
