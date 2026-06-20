# `scripts/triage/` — Surface Index

A small **issue-triage state machine** over `docs/triage.json`. Issues move through legal
states; `state-transition.sh` is the only writer and `reconcile.sh` is a mandatory gate.
**User/buyer:** maintainer / triager clearing a backlog in auditable batches. Requires
`jq`. Template: [`../SURFACE-PACKET.template.md`](../SURFACE-PACKET.template.md).

| Name | Problem solved | Run | Verify | Safety | Level |
|------|----------------|-----|--------|--------|-------|
| `batch-init.sh` | Declare a batch and seed its issues into triage state | `bash scripts/triage/batch-init.sh <batch-id> <phase> <issue#...>` | Issues appear in `docs/triage.json` as `UNREAD` under the batch | Writes `docs/triage.json` only | L1 |
| `classify-all.sh` | Classify every `UNREAD` issue in one pass | `bash scripts/triage/classify-all.sh` | `UNREAD` count drops to 0; each gets an `action` + state | Writes `docs/triage.json` (label/title heuristics) | L1 |
| `classify-batch.sh` | Classify just one batch | `bash scripts/triage/classify-batch.sh <batch-id> <phase>` | That batch's issues get `action` + state transitions | Writes `docs/triage.json` | L1 |
| `state-transition.sh` | The **only** sanctioned way to modify triage state | `bash scripts/triage/state-transition.sh <issue#> <to-state> [--evidence file:line] [--pr url]` | Legal transitions apply; illegal ones rejected nonzero | Writes `docs/triage.json`; enforces state machine | L1 |
| `reconcile.sh` | Mandatory end-of-batch gate | `bash scripts/triage/reconcile.sh <batch-id>` | Exit 0 only if all accounted, no CLOSED-without-evidence, no `UNREAD`, tests pass; HARD STOP otherwise | Read/validate; no writes | L1 |
| `report.sh` | Print the triage dashboard | `bash scripts/triage/report.sh` | Prints counts/states; errors if `triage.json` missing | Read-only | L0 |

> **Disable/uninstall (all):** stateless CLIs; revert `docs/triage.json` via git to undo.
> **Proof:** all use `set -euo pipefail`; `state-transition.sh` rejects illegal transitions
> and `reconcile.sh` hard-stops on any failure. Capture a reconcile log on next batch.
