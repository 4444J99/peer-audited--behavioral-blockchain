#!/usr/bin/env bash
# LAN sharing is the read-only snapshot, never the loopback live API/demo.
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
out_dir="$repo_root/src/web/out"
output_png="$repo_root/artifacts/styx-demo-qr.png"
die() { echo "FAIL: $*" >&2; exit 1; }

[ -f "$out_dir/index.html" ] && [ -f "$out_dir/tour/index.html" ] ||
  die "Build and verify the read-only export: npm run snapshot:capture && npm run snapshot:build && npm run snapshot:verify"
web_port="${STYX_DEMO_SHARE_PORT:-4315}"
[[ "$web_port" =~ ^[0-9]{1,5}$ ]] && (( 10#$web_port > 0 && 10#$web_port < 65536 )) || die "invalid snapshot port"
lan_ip="${STYX_DEMO_SHARE_HOST:-}"
if [ -z "$lan_ip" ]; then
  default_if="$(route get default 2>/dev/null | awk '/interface:/{print $2; exit}' || true)"
  [ -z "$default_if" ] || lan_ip="$(ipconfig getifaddr "$default_if" 2>/dev/null || true)"
fi
if [ -z "$lan_ip" ]; then
  lan_ip="$(node -e 'const os=require("node:os"); const address=Object.values(os.networkInterfaces()).flat().find(x=>x&&x.family==="IPv4"&&!x.internal); if(address)process.stdout.write(address.address);')"
fi
[[ "$lan_ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "no IPv4 LAN address; set STYX_DEMO_SHARE_HOST to this machine's LAN address"
share_url="http://${lan_ip}:${web_port}/tour/"
probe="$(mktemp)"
trap 'rm -f "$probe"' EXIT
curl -q -fsS --http1.1 --noproxy '*' --max-time 8 -o "$probe" "$share_url" ||
  die "Start the static listener in another terminal: STYX_SNAPSHOT_LAN=true npm run snapshot:serve"
cmp -s "$probe" "$out_dir/tour/index.html" || die "listener does not serve this exact snapshot; refusing to share a different or live demo"
api_status="$(curl -q -sS --http1.1 --noproxy '*' --max-time 8 -o /dev/null -w '%{http_code}' "http://${lan_ip}:${web_port}/api/users/me")"
[ "$api_status" = 404 ] || die "unexpected API response ($api_status); refusing to share a live/proxied listener"

printf '\nRead-only synthetic snapshot for the room:\n  %s\n\n' "$share_url"
mkdir -p "$repo_root/artifacts"
if npx --yes qrcode --version >/dev/null 2>&1; then
  npx --yes qrcode -t utf8 "$share_url" 2>/dev/null || true
  npx --yes qrcode -w 720 -o "$output_png" "$share_url" >/dev/null 2>&1 && echo "Printable QR: $output_png"
else
  echo "QR unavailable; the URL above is sufficient."
fi
cat <<'INFO'
No live login, API writes, or feedback collection are provided by this snapshot.
Do not share the local synthetic password. Keep the snapshot terminal open;
Ctrl-C there stops sharing. After changing Wi-Fi, rerun this command.
The full interactive presenter demo remains bound to loopback.
INFO
