#!/usr/bin/env bash
# Builds and ships the Cloudflare snapshot: a fully static export of the demo running
# on captured synthetic fixtures, for the people who are NOT in the room.
#
# It is a strictly smaller claim than the local demo. Reads work, the guided tour works,
# and every write is refused in plain language, because there is no API, no database and
# no Redis behind it -- only JSON captured from a demo run that passed its gate.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
web_dir="$repo_root/src/web"
out_dir="$web_dir/out"
fixtures_dir="$web_dir/public/demo-snapshot"
native_state="$repo_root/artifacts/styx-demo-native.env"
project="${STYX_SNAPSHOT_PAGES_PROJECT:-styx-demo-snapshot}"

die() { echo "FAIL: $*" >&2; exit 1; }
info() { echo "▸ $*"; }
ok() { echo "✓ $*"; }

node24() {
  if command -v mise >/dev/null 2>&1; then
    mise x node@24 -- "$@"
  else
    "$@"
  fi
}

capture() {
  [ -f "$native_state" ] || die "start the demo first (npm run demo:reset:verify); fixtures are captured from a live run."
  local web_url="" demo_password="" key value
  while IFS='=' read -r key value; do
    case "$key" in
      STYX_DEMO_WEB_URL) web_url="$value" ;;
      STYX_DEMO_PASSWORD) demo_password="$value" ;;
      *) ;;
    esac
  done < "$native_state"
  [ -n "$web_url" ] || die "no web URL in the demo state file."
  [ -n "$demo_password" ] || die "no synthetic password in the demo state file."

  info "Capturing fixtures from the live demo at ${web_url} ..."
  STYX_DEMO_WEB_URL="$web_url" STYX_DEMO_PASSWORD="$demo_password" \
    node24 node "$repo_root/scripts/demo/capture-snapshot.mjs"
}

build() {
  [ -d "$fixtures_dir" ] || die "no fixtures. Run: npm run snapshot:capture"
  local count
  count="$(find "$fixtures_dir" -name '*.json' | wc -l | tr -d ' ')"
  [ "$count" -gt 0 ] || die "fixtures directory is empty. Run: npm run snapshot:capture"

  info "Building the static snapshot (${count} persona fixture file(s)) ..."
  # A snapshot build overwrites .next, so the running demo would afterwards serve
  # snapshot client code that answers from fixtures and never calls /api. Say so;
  # this exact confusion cost two capture runs to diagnose.
  cd "$web_dir"
  NEXT_PUBLIC_STYX_SNAPSHOT=true \
  NEXT_PUBLIC_STYX_TEST_MONEY_MODE=true \
  NEXT_PUBLIC_STYX_PRIVATE_BETA=true \
  NEXT_PUBLIC_STYX_ENV_LABEL=cloudflare-snapshot \
  NEXT_PUBLIC_STYX_FEATURE_B2B_HR_UI=true \
  NODE_ENV=production \
    node24 npx next build
  cd "$repo_root"

  [ -f "$out_dir/index.html" ] || die "export produced no index.html."
  ok "Static snapshot in ${out_dir} ($(find "$out_dir" -name '*.html' | wc -l | tr -d ' ') pages)."
  echo "  NOTE: this overwrote .next — rebuild the local demo before capturing again:"
  echo "        npm run demo:reset:verify"
}

serve() {
  [ -f "$out_dir/index.html" ] || die "nothing built. Run: npm run snapshot:build"
  info "Serving the snapshot on http://127.0.0.1:4315 (Ctrl-C to stop) ..."
  # NOT `serve -s`. SPA mode rewrites every unmatched path to index.html, so each
  # route returns the landing page with a 200 while the client router still shows the
  # right URL -- a local preview that looks fine and tests nothing. This export has a
  # real HTML file per route, which is also how Cloudflare Pages serves it.
  node24 npx --yes serve "$out_dir" -l 4315
}

deploy() {
  [ -f "$out_dir/index.html" ] || die "nothing built. Run: npm run snapshot:build"
  command -v npx >/dev/null 2>&1 || die "npx is required to run wrangler."
  info "Deploying to Cloudflare Pages project '${project}' ..."
  npx --yes wrangler pages deploy "$out_dir" --project-name "$project"
}

case "${1:-}" in
  capture) capture ;;
  build) build ;;
  serve) serve ;;
  deploy) deploy ;;
  *) die "usage: bash scripts/demo/snapshot.sh {capture|build|serve|deploy}" ;;
esac
