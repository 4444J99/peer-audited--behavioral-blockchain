#!/usr/bin/env bash
# Source this helper before a local demo launch. It creates process-local,
# random test-only values when an operator has not injected their own values.

demo_secrets_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
demo_password_file="${demo_secrets_root}/artifacts/styx-demo-local.env"

demo_random_value() {
  local node_bin="node"
  if command -v mise >/dev/null 2>&1; then
    mise x node@24 -- node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))"
    return
  fi
  "$node_bin" -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))"
}

ensure_demo_secrets() {
  local key
  for key in STYX_DEMO_PASSWORD JWT_SECRET APP_SECRET ANONYMIZE_SALT ZK_EXHAUST_SECRET STYX_WEBHOOK_SECRET INTERNAL_SERVICE_TOKEN ENTERPRISE_SSO_SECRET STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY; do
    if [[ -z "${!key:-}" ]]; then
      printf -v "$key" '%s' "$(demo_random_value)"
      export "$key"
    fi
  done
  mkdir -p "$(dirname "$demo_password_file")"
  (umask 077; printf 'STYX_DEMO_PASSWORD=%s\n' "$STYX_DEMO_PASSWORD" > "$demo_password_file")
}
