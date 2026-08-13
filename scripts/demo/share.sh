#!/usr/bin/env bash
# Prints the address people in the room should open, as a URL and as a QR code.
#
# The demo binds to every interface already, so sharing it is purely a matter of
# telling people the right host -- and the loopback address the launcher prints is
# the one address that will NOT work from anyone else's device. This resolves the
# LAN address instead, and refuses to print a guess.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
native_state="$repo_root/artifacts/styx-demo-native.env"
output_png="$repo_root/artifacts/styx-demo-qr.png"

die() { echo "FAIL: $*" >&2; exit 1; }

web_port=""
if [ -f "$native_state" ]; then
  while IFS='=' read -r key value; do
    [ "$key" = "STYX_DEMO_WEB_URL" ] && web_port="${value##*:}"
  done < "$native_state"
fi
# Compose demo, or a launcher that has not written state yet.
[ -n "$web_port" ] && [[ "$web_port" =~ ^[0-9]+$ ]] || web_port="${STYX_DEMO_SHARE_PORT:-3001}"

# The interface carrying the default route is the one the room is on. Falling back
# to a hardcoded en0 gets this wrong on any machine using Wi-Fi as a secondary.
lan_ip="${STYX_DEMO_SHARE_HOST:-}"
if [ -z "$lan_ip" ]; then
  default_if="$(route get default 2>/dev/null | awk '/interface:/{print $2; exit}' || true)"
  [ -n "$default_if" ] && lan_ip="$(ipconfig getifaddr "$default_if" 2>/dev/null || true)"
fi
if [ -z "$lan_ip" ]; then
  for candidate in en0 en1 en2; do
    lan_ip="$(ipconfig getifaddr "$candidate" 2>/dev/null || true)"
    [ -n "$lan_ip" ] && break
  done
fi
[ -n "$lan_ip" ] || die "no LAN address found. Join a network, or set STYX_DEMO_SHARE_HOST."

share_url="http://${lan_ip}:${web_port}/tour"

# Prove the address works from the network side before handing it to anyone. -q
# ignores the operator's curlrc, whose --http2 makes a healthy Next server look dead.
if ! curl -q -fsS --http1.1 --max-time 8 -o /dev/null "$share_url"; then
  die "nothing is answering at ${share_url}. Start the demo first: npm run demo:reset:verify"
fi

echo ""
echo "  Share this with the room:"
echo ""
echo "      ${share_url}"
echo ""

if npx --yes qrcode --version >/dev/null 2>&1; then
  npx --yes qrcode -t utf8 "$share_url" 2>/dev/null || true
  # Default output is ~100px, which is unscannable on a projector or across a
  # table. Render it large enough to point a phone at from the other side of a room.
  npx --yes qrcode -w 720 -o "$output_png" "$share_url" >/dev/null 2>&1 &&
    echo "  Printable QR: ${output_png}"
else
  echo "  (QR generation needs npx and network access; the URL above is enough.)"
fi

# Notes are collected by a separate process on purpose, so telemetry can never
# break a demo launch. That also means it can be silently absent -- say so here
# rather than letting the presenter discover it in an empty report afterwards.
feedback_port="${STYX_DEMO_FEEDBACK_PORT:-4312}"
if curl -q -fsS --http1.1 --max-time 4 -o /dev/null "http://127.0.0.1:${feedback_port}/health"; then
  echo "  Notes + interaction tracking: ON (collector listening on ${feedback_port})"
else
  echo "  Notes + interaction tracking: OFF — start it first:  npm run demo:feedback"
fi

cat <<INFO

  Everyone on this Wi-Fi can open that. The guided panel appears on every route,
  and each person's "Explain it for" depth is stored in their own browser.

  Read the synthetic password aloud from:  npm run demo:credentials
  Personas: river@demo.styx.protocol | dr.moira@demo.styx.protocol | hr.lead@acheron.example

  This address changes when you join a different network. Re-run this command.
  Keep the machine awake while presenting:  caffeinate -d
INFO
