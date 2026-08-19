#!/usr/bin/env bash
# Runs the demo feedback collector as a detached process, the way scripts/demo/native.sh
# runs the demo itself -- so closing the terminal that started it does not silently stop
# collecting notes while the demo carries on working perfectly.
#
# It owns exactly one port, one PID file and one log, all explicitly named, and it is
# deliberately NOT part of the demo's own state file: that file has three strict parsers
# which reject unknown keys, and telemetry must never be able to break a demo launch.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
state_dir="$repo_root/artifacts"
pid_file="$state_dir/styx-demo-feedback.pid"
log_file="$state_dir/styx-demo-feedback.log"
port="${STYX_DEMO_FEEDBACK_PORT:-4312}"

die() { echo "FAIL: $*" >&2; exit 1; }
info() { echo "▸ $*"; }
ok() { echo "✓ $*"; }

# Resolve the real interpreter rather than launching through `mise x`. `mise x node@24 --
# node server.mjs` spawns the server as a CHILD of the mise wrapper, so the recorded PID
# is the wrapper's -- and stopping it would reparent a live collector to init, still
# holding the port. This is the same defect that was fixed in scripts/dev/run-api.mjs.
node_bin() {
  if command -v mise >/dev/null 2>&1; then
    mise x node@24 -- which node
  else
    command -v node
  fi
}

health_ok() {
  # -q ignores the operator's curlrc, whose --http2 makes a healthy local server
  # look dead by requesting an h2c upgrade that Node answers by closing the socket.
  curl -q -fsS --http1.1 --max-time 4 -o /dev/null "http://127.0.0.1:${port}/health" 2>/dev/null
}

read_pid() {
  [ -r "$pid_file" ] || return 1
  local value
  value="$(cat "$pid_file" 2>/dev/null || true)"
  [[ "$value" =~ ^[0-9]+$ ]] || return 1
  printf '%s' "$value"
}

is_running() {
  local pid
  pid="$(read_pid)" || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  # A recycled PID belonging to some unrelated process must not read as "running".
  [[ "$(ps -p "$pid" -o comm= 2>/dev/null || true)" == *node* ]] || return 1
}

stop_collector() {
  local pid
  if ! pid="$(read_pid)"; then
    rm -f "$pid_file"
    return 0
  fi
  if kill -0 "$pid" 2>/dev/null; then
    info "Stopping collector (pid ${pid}) ..."
    pkill -TERM -P "$pid" 2>/dev/null || true
    kill -TERM "$pid" 2>/dev/null || true
    for _ in 1 2 3 4 5; do
      kill -0 "$pid" 2>/dev/null || break
      sleep 1
    done
    if kill -0 "$pid" 2>/dev/null; then
      pkill -KILL -P "$pid" 2>/dev/null || true
      kill -KILL "$pid" 2>/dev/null || true
    fi
  fi
  rm -f "$pid_file"
}

start_collector() {
  if is_running && health_ok; then
    ok "Collector already running on ${port} (pid $(read_pid))."
    return 0
  fi
  # A stale PID file from a killed process, or a half-dead instance.
  stop_collector

  if health_ok; then
    die "port ${port} is already answering but is not this collector. Stop it, or set STYX_DEMO_FEEDBACK_PORT."
  fi

  mkdir -p "$state_dir"
  local bin
  bin="$(node_bin)"
  [ -x "$bin" ] || die "Node 24 was not found; the collector needs it."

  info "Starting collector on ${port} ..."
  STYX_DEMO_FEEDBACK_PORT="$port" nohup "$bin" "$repo_root/scripts/demo/feedback-server.mjs" \
    >"$log_file" 2>&1 < /dev/null &
  local pid=$!
  printf '%s\n' "$pid" > "$pid_file"

  for _ in $(seq 1 20); do
    if health_ok; then
      ok "Collector detached on ${port} (pid ${pid}). It survives this terminal closing."
      echo "  Log:   ${log_file}"
      echo "  Data:  ${state_dir}/demo-feedback/"
      echo "  Stop:  npm run demo:feedback:stop"
      return 0
    fi
    kill -0 "$pid" 2>/dev/null || break
    sleep 1
  done

  rm -f "$pid_file"
  kill "$pid" 2>/dev/null || true
  die "collector did not become ready; inspect ${log_file}."
}

status_collector() {
  if is_running && health_ok; then
    ok "Collector running on ${port} (pid $(read_pid))."
  elif is_running; then
    echo "PARTIAL: pid $(read_pid) is alive but ${port} is not answering; inspect ${log_file}." >&2
    exit 1
  else
    echo "Collector is NOT running. Start it with: npm run demo:feedback" >&2
    exit 1
  fi
  local dir="${state_dir}/demo-feedback"
  if [ -d "$dir" ]; then
    local notes=0 events=0
    [ -r "$dir/notes.ndjson" ] && notes="$(wc -l < "$dir/notes.ndjson" | tr -d ' ')"
    [ -r "$dir/events.ndjson" ] && events="$(wc -l < "$dir/events.ndjson" | tr -d ' ')"
    echo "  Collected so far: ${notes} note(s), ${events} event(s)"
    echo "  Read it with:     npm run demo:feedback:report"
  fi
}

case "${1:-start}" in
  start) start_collector ;;
  stop) stop_collector; ok "Collector stopped. Collected data is retained." ;;
  restart) stop_collector; start_collector ;;
  status) status_collector ;;
  *) die "usage: bash scripts/demo/feedback.sh {start|stop|restart|status}" ;;
esac
