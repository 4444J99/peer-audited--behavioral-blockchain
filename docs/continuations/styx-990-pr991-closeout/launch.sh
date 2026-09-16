#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

EXPECTED_BRANCH="chore/styx-990-pr991-closeout"
RECEIPT="docs/continuations/styx-990-pr991-closeout/workstream.json"
PRIVATE_CAPSULE="$ROOT/.limen-workstream"
CONTRACT_HELPER="$PRIVATE_CAPSULE/workstream-contract.py"
IDENTITY="$PRIVATE_CAPSULE/capsule.identity"
EXPECTED_INVOCATION_SHA256="5ef8b586fea9929c0190310395517d9ec2a9897d883ecf9910ccfbbbd477bc16"

[[ "$(git branch --show-current)" == "$EXPECTED_BRANCH" ]] || {
  echo "launch refused: enter the isolated $EXPECTED_BRANCH worktree" >&2
  exit 2
}
[[ -s "$RECEIPT" ]] || {
  echo "launch refused: tracked workstream receipt missing" >&2
  exit 2
}
[[ -s "$PRIVATE_CAPSULE/README.md" && -x "$PRIVATE_CAPSULE/kickstart.sh" && -s "$CONTRACT_HELPER" ]] || {
  echo "launch refused: private Limen capsule missing; rehydrate with the canonical Limen workstream launcher" >&2
  exit 2
}

python3 - "$IDENTITY" "$EXPECTED_INVOCATION_SHA256" "$PRIVATE_CAPSULE" \
  "$PRIVATE_CAPSULE/README.md" \
  "$PRIVATE_CAPSULE/manifest.md" \
  "$PRIVATE_CAPSULE/workstream.json" \
  "$CONTRACT_HELPER" \
  "$PRIVATE_CAPSULE/intent.md" \
  "$PRIVATE_CAPSULE/runtime.md" \
  "$PRIVATE_CAPSULE/closeout.md" \
  "$PRIVATE_CAPSULE/kickstart.sh" <<'PY'
import hashlib
import json
import sys
from pathlib import Path

identity_path = Path(sys.argv[1])
invocation_sha256 = sys.argv[2]
capsule_dir = Path(sys.argv[3])
names = [
    "README.md",
    "manifest.md",
    "workstream.json",
    "workstream-contract.py",
    "intent.md",
    "runtime.md",
    "closeout.md",
    "kickstart.sh",
]
paths = [Path(raw) for raw in sys.argv[4:]]
try:
    resolved_capsule = capsule_dir.resolve(strict=True)
    actual = json.loads(identity_path.read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError) as exc:
    raise SystemExit(f"launch refused: invalid capsule identity: {exc}")
if (
    capsule_dir.is_symlink()
    or identity_path.is_symlink()
    or identity_path.parent.resolve() != resolved_capsule
):
    raise SystemExit("launch refused: invalid capsule identity path")
digests = {}
for name, path in zip(names, paths, strict=True):
    if (
        path.name != name
        or path.is_symlink()
        or not path.is_file()
        or path.resolve().parent != resolved_capsule
    ):
        raise SystemExit(f"launch refused: invalid capsule module path: {name}")
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    digests[name] = digest.hexdigest()
expected = {
    "schema": "limen.workstream.capsule-identity.v2",
    "invocation_sha256": invocation_sha256,
    "modules": digests,
}
if actual != expected:
    raise SystemExit(
        "launch refused: capsule module bytes changed; emit a successor capsule"
    )
print("capsule identity: valid module hashes")
PY

python3 - "$RECEIPT" "$PRIVATE_CAPSULE/workstream.json" "$CONTRACT_HELPER" <<'PY'
import importlib.util
import json
import sys
from pathlib import Path

receipt_path = Path(sys.argv[1])
private_contract_path = Path(sys.argv[2])
helper_path = Path(sys.argv[3])

spec = importlib.util.spec_from_file_location("capsule_workstream_contract", helper_path)
if spec is None or spec.loader is None:
    raise SystemExit("launch refused: contract validator unavailable")
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)

receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
module.validate_workstream_receipt(receipt)
private_contract = json.loads(private_contract_path.read_text(encoding="utf-8"))
if receipt.get("contract") != private_contract:
    raise SystemExit("launch refused: public receipt and private contract differ")
if receipt.get("slug") != "styx-990-pr991-closeout":
    raise SystemExit("launch refused: receipt slug mismatch")
if receipt.get("branch") != "chore/styx-990-pr991-closeout":
    raise SystemExit("launch refused: receipt branch mismatch")
if receipt.get("workstream") != "styx-verify":
    raise SystemExit("launch refused: receipt workstream mismatch")
print("capsule receipt: valid strict contract")
PY

runway_status=0
python3 - "$RECEIPT" <<'PY' || runway_status=$?
import json
import sys
import time
from pathlib import Path

receipt = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
runway = receipt["contract"]["runway"]
started = runway.get("started_epoch")
deadline = runway.get("deadline_epoch")
if started is None and deadline is None:
    print("runway status: unstarted finite contract")
    raise SystemExit(0)
if not isinstance(started, int) or not isinstance(deadline, int) or deadline <= started:
    print("runway status: invalid admitted timing", file=sys.stderr)
    raise SystemExit(2)
remaining = deadline - int(time.time())
if remaining <= 0:
    print("runway status: expired; emit a successor", file=sys.stderr)
    raise SystemExit(75)
if remaining < 1800:
    print(f"runway status: {remaining}s remaining; emit a successor", file=sys.stderr)
    raise SystemExit(75)
print("runway status: active with more than 1800s remaining")
PY
if [[ "$runway_status" -ne 0 ]]; then
  exit "$runway_status"
fi

if [[ "${1:-}" == "--check" ]]; then
  [[ $# -eq 1 ]] || {
    echo "usage: $0 [--check]" >&2
    exit 2
  }
  bash -n "$PRIVATE_CAPSULE/kickstart.sh"
  echo "launch surface: ready"
  exit 0
fi

[[ $# -eq 0 ]] || {
  echo "usage: $0 [--check]" >&2
  exit 2
}

exec bash "$PRIVATE_CAPSULE/kickstart.sh"
