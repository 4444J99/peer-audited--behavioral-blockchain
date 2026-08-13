#!/usr/bin/env bash
# Print the synthetic-only login password created by the local demo launcher.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
native_state="${repo_root}/artifacts/styx-demo-native.env"
password_file="${repo_root}/artifacts/styx-demo-local.env"
password=""

read_password() {
  local file="$1" key value
  [ -r "$file" ] || return 1
  while IFS='=' read -r key value; do
    if [[ "$key" == "STYX_DEMO_PASSWORD" ]]; then
      password="$value"
    fi
  done < "$file"
  [[ -n "$password" && "$password" != *$'\n'* ]]
}

read_password "$native_state" || read_password "$password_file" || {
  echo "FAIL: launch or reset the synthetic demo before retrieving its local password." >&2
  exit 1
}

printf '%s\n' "$password"
