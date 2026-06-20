# Styx Automation Scripts — Surface Index

Operating rule: **no orphan artifacts.** Every script here has a surface packet (10 fields).
New scripts copy [`SURFACE-PACKET.template.md`](./SURFACE-PACKET.template.md).

> **Drift note (2026-06-20):** the previous version of this README documented four scripts
> that do not exist in this repo (`db-migrate.sh`, `seed-furies.ts`, `generate-honeypots.sh`,
> `deploy-r2-worker.sh`) and a `make test-scripts` target absent from the Makefile. Those
> were phantom entries. This index documents only artifacts that actually exist on disk.

## Coverage — 44 artifacts, all packeted

| Surface | Artifacts | Packet |
|---------|-----------|--------|
| Top-level `scripts/` | 9 | ✅ this file |
| `scripts/smoke/` | 9 | ✅ [smoke/README.md](./smoke/README.md) |
| `scripts/validation/` | 11 | ✅ [validation/README.md](./validation/README.md) |
| `scripts/triage/` | 6 | ✅ [triage/README.md](./triage/README.md) |
| `scripts/dev/` | 5 | ✅ [dev/README.md](./dev/README.md) |
| `scripts/infra/` | 3 | ✅ [infra/README.md](./infra/README.md) |
| `scripts/analysis/` | 1 | ✅ [analysis/README.md](./analysis/README.md) |

---

## The Board Governance Toolkit

Five config-driven scripts that turn a GitHub Project board into a governed, audit-logged
system of record. All read instance values from `board.config.json` (override with
`BOARD_CONFIG=/path/to/config`). The scripts are the *process*; the config is the *instance*.
All require an authenticated `gh` CLI with project scope.

### `transition-issue.sh`

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | transition-issue.sh — the write gatekeeper |
| 2 | **Problem solved** | All issue-metadata writes flow through one validated, audit-logged path instead of ad-hoc board edits. |
| 3 | **User / buyer** | Maintainer / PM running a governed GitHub Project board. |
| 4 | **Path** | `scripts/transition-issue.sh` |
| 5 | **Run** | `bash scripts/transition-issue.sh <issue#> --status <STATUS> --reason "why"` · `... --field <F> --value <V>` · `... --gate-met --reason "..."` |
| 6 | **Verify** | Board field updates **and** a new line appends to the audit log in `board.config.json:audit_log`; illegal transitions are rejected with a nonzero exit. |
| 7 | **Disable** | Stateless CLI; stop invoking it. Reverse a change with another transition. |
| 8 | **Safety** | Writes to the live GitHub Project via `gh`; needs auth + project scope. Touches only the configured board + audit log. |
| 9 | **Proof** | `set -euo pipefail`; loads/validates config; refuses on missing `board.config.json`. (Last live run: capture on next use.) |
| 10 | **Level** | L1 documented command |

### `audit-board.sh`

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | audit-board.sh — drift detector |
| 2 | **Problem solved** | Catches board field values that changed *without* going through `transition-issue.sh` (out-of-band edits). |
| 3 | **User / buyer** | Same maintainer/PM; governance auditor. |
| 4 | **Path** | `scripts/audit-board.sh` |
| 5 | **Run** | `bash scripts/audit-board.sh` (check) · `bash scripts/audit-board.sh --fix` (then regenerate tracking table) |
| 6 | **Verify** | Reports zero drift when board matches the audit log; lists offending fields when not. |
| 7 | **Disable** | Stateless read (write only with `--fix`). Stop invoking. |
| 8 | **Safety** | Read-only by default; `--fix` regenerates the tracking table. Needs `gh` auth. |
| 9 | **Proof** | Compares `gh project item-list` (limit 200) against `audit_log`. |
| 10 | **Level** | L1 documented command |

### `sync-tracking-table.sh`

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | sync-tracking-table.sh — materializer |
| 2 | **Problem solved** | Generates the read-only SOP tracking table (`SOP-SS-TRK-001`) from the board, which stays the single source of truth. |
| 3 | **User / buyer** | Maintainer publishing a human-readable board view into docs. |
| 4 | **Path** | `scripts/sync-tracking-table.sh` |
| 5 | **Run** | `bash scripts/sync-tracking-table.sh` (stdout) · `--write` (overwrite SOP file) |
| 6 | **Verify** | Printed/written table matches current board items; `--write` updates `docs/sops/SOP-SS-TRK-001_001-ontology_issue_tracking.md`. |
| 7 | **Disable** | Stateless without `--write`. Revert the SOP file via git. |
| 8 | **Safety** | Read from board; only writes the one SOP doc with `--write`. Needs `gh` auth. |
| 9 | **Proof** | `gh project item-list` (limit 200) → table. |
| 10 | **Level** | L1 documented command |

### `setup-board.sh`

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | setup-board.sh — instantiation |
| 2 | **Problem solved** | Stands up a fresh project board (fields, status options, views) from config — run once per new project. |
| 3 | **User / buyer** | Maintainer onboarding a new repo to the governance toolkit. |
| 4 | **Path** | `scripts/setup-board.sh` |
| 5 | **Run** | `bash scripts/setup-board.sh` · `--fields-only` · `--views-only` · `--dry-run` |
| 6 | **Verify** | Board shows the configured custom fields, status options, and views; `--dry-run` prints intended changes without applying. |
| 7 | **Disable** | One-shot setup. Remove fields/views in GitHub UI to undo. |
| 8 | **Safety** | Creates board structure via `gh`; needs auth + project admin. Use `--dry-run` first. |
| 9 | **Proof** | Reads `owner`/`project_num`/`project_id` from config; supports dry-run. |
| 10 | **Level** | L1 documented command |

### `detect-redundancy.sh` (+ `detect-redundancy.py`)

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | detect-redundancy — duplicate/near-duplicate issue finder |
| 2 | **Problem solved** | Surfaces duplicate and near-duplicate issues on the board before they fragment work. |
| 3 | **User / buyer** | Maintainer / triager keeping the backlog deduplicated. |
| 4 | **Path** | `scripts/detect-redundancy.sh` (wrapper) · `scripts/detect-redundancy.py` (similarity logic) |
| 5 | **Run** | `bash scripts/detect-redundancy.sh` (threshold 0.6) · `--threshold 0.5` · `--status <S>` |
| 6 | **Verify** | Prints matched issue pairs above the similarity threshold; exits cleanly with none below it. |
| 7 | **Disable** | Stateless read. Stop invoking. |
| 8 | **Safety** | Read-only board fetch (`gh`, limit 500). No writes. |
| 9 | **Proof** | Configurable threshold/status filter; errors if board fetch is empty. |
| 10 | **Level** | L1 documented command |

---

## Build / CI Gates

### `setup.sh`

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | setup.sh — system bootstrap |
| 2 | **Problem solved** | One command to stand up the full dev environment (DB/Redis, deps, build, tests). |
| 3 | **User / buyer** | New contributor or CI provisioning Styx locally. |
| 4 | **Path** | `scripts/setup.sh` |
| 5 | **Run** | `bash scripts/setup.sh` |
| 6 | **Verify** | Prints "INITIALIZATION COMPLETE. STYX IS LIVE." after `make docker-up && make install && make build && make test` all succeed. |
| 7 | **Disable** | `make clean`; `docker compose ... down` to tear down services. |
| 8 | **Safety** | Starts local Docker services and runs the test matrix; no external/network writes. |
| 9 | **Proof** | Delegates to existing Makefile targets (`docker-up`, `install`, `build`, `test`). |
| 10 | **Level** | L1 documented command |

### `gatekeeper-scan.sh`

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | gatekeeper-scan.sh — Validation Gate (terminology) |
| 2 | **Problem solved** | Detects forbidden themed terms (Fury, Bounty, Stake, …) in built bundles for Redacted-Mode (iOS/Android) builds. |
| 3 | **User / buyer** | Release engineer gating store builds; compliance reviewer. |
| 4 | **Path** | `scripts/gatekeeper-scan.sh` |
| 5 | **Run** | `bash scripts/gatekeeper-scan.sh [dir]` (default `dist/`) |
| 6 | **Verify** | Exit 0 with no forbidden terms found; nonzero + flagged occurrences otherwise. Requires `make build` first. |
| 7 | **Disable** | Stateless scan; remove from the release pipeline to skip. |
| 8 | **Safety** | Read-only scan of build output; detects (does not replace) terms. |
| 9 | **Proof** | Maps 10 forbidden→neutral terms; errors if scan dir missing. |
| 10 | **Level** | L1 documented command |

---

## Chat Knowledge Base

### `build-chat-context.ts`

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | build-chat-context.ts — static knowledge-base builder |
| 2 | **Problem solved** | Assembles key source files into one static knowledge base — no vector DB; fits Llama 3.3 70B's 128K context. |
| 3 | **User / buyer** | The site's chat feature / its maintainer. |
| 4 | **Path** | `scripts/build-chat-context.ts` |
| 5 | **Run** | `npx tsx scripts/build-chat-context.ts` |
| 6 | **Verify** | Regenerates `src/web/lib/styx-knowledge.ts` with assembled content. |
| 7 | **Disable** | Stateless generator; revert the output file via git. |
| 8 | **Safety** | Reads repo source, writes one generated lib file. No network. |
| 9 | **Proof** | Resolves repo root from module URL; reads a declared `SourceFile[]` set. |
| 10 | **Level** | L1 documented command |

---

## Conventions (was: "Ironclad")

- Bash scripts use `set -euo pipefail`; Node uses strict try/catch.
- Failures log to `stderr`, exit code `1`.
- Board scripts are portable: all instance values live in `board.config.json`.
