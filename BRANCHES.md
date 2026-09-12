# Branch Constitution & Repository Stewardship

Default branch: `main`  
Policy: GitHub Flow anchored on five standing program lanes.  
Worktrees: Exactly one git worktree per active short-lived working branch. Never commit directly to standing lanes or trunk.

---

## 1. Standing Branches (Always Exist)

| Branch | Purpose | Merge Target | Green Invariant |
| :--- | :--- | :--- | :--- |
| `main` | Production-true trunk. Always releasable. | Tagged releases (`v*`) | All 10 workspace test suites pass, Gates 01–07 hold, clean npm audit. |
| `lane/verify` | Proof: tests, contracts, CI, reproducibility, live receipts. | `main` | Staging tests pass, verification suite is stricter or equally true. |
| `lane/heal` | Repair: rot, broken routes, stale PR recovery, dependency healing. | `main` | Previously failing tests/routes pass; zero regressions on core ledger. |
| `lane/expand-product` | Stated scope: mobile bridges, UI workbench, Fury consensus, CLI. | `main` | New features match specifications and pass linguistic cloaker. |
| `lane/expand-external` | External unlock: Stripe production, Apple Developer, legal sign-offs. | `main` | External credentials and legal docs verified and securely stored. |
| `lane/evolve-platform` | Evolution: B2B sandboxes, self-hosting GHCR, and post-beta features. | `main` | Multi-tenant isolation verified, zero performance degradation. |

Standing lanes must never diverge into permanent forks. Rebase or merge `main` into lanes regularly via `scripts/lanes/sync-lanes.sh`.

---

## 2. Issue Ownership Directory (90 Open Issues)

Every issue in Styx is strictly assigned to one of the standing lanes. External and remote agents MUST consult this directory before cutting a branch:

```
docs/triage/issue-ownership.json
```

### Lane Assignment Summary:

| Owning Lane | Scope & Core Issues | Action / Work Branch Pattern |
| :--- | :--- | :--- |
| **`main`** | **Parent Phase Epics**: #555 (Beta), #556 (Gamma), #557 (Delta), #558 (Omega). | Orchestration gates; advance only when child issues pass. |
| **`lane/verify`** | **Testing & Pilot Verification**: #369 (Dogfood), #363 (1–3 Practitioner Pilot), #374 (Beta Feedback). | `work/verify/<issue>-<intent>` |
| **`lane/heal`** | **Bugfixes & Support Operations**: #371 (Support channels), #321 (Fury Reviewer Appeals Policy), Route 404 repairs. | `work/heal/<issue>-<intent>` |
| **`lane/expand-product`** | **Product & Mobile Expansion**: #372 (TestFlight 50-100), #376 (Open Beta 500+), #378 (App Store GA), #341 (Audience), #343 (Social OS), #346 (PR Kit), #134 (HealthKit & Camera), #124–#126. | `work/expand-product/<issue>-<intent>` |
| **`lane/expand-external`** | **Legal, Escrow & Regulatory**: #315 (Legal Counsel), #316 (FBO Escrow Custody), #317 (State Jurisdiction Matrix), #325 (Prize Indemnity), #349 (Stripe Prod), #365 / #141 (Apple Dev), #132 (KYC), #133 (Merchant settlement), #146 (App Store UGC), #148. | `work/expand-external/<issue>-<intent>` |
| **`lane/evolve-platform`** | **Enterprise, Security & Post-Beta**: #361 (B2B Sandbox), #323 (SOC2), #267, and 33x Post-Beta Brainstorms (#49–#111). | `work/evolve-platform/<issue>-<intent>` |
| **`SUPERSEDED`** | **Closed Trackers**: #283, #285, #286, #288, #290, #291, #293 (Illogical department trackers). | Closed; zero code residue. |

---

## 3. Working Branches & Multi-Agent Protocol

Pattern: `work/<lane-slug>/<issue-number>-<short-intent>` (or `fix/`, `feat/`, `chore/`).

### Protocol for Autonomous & External Agents:

1. **Claim the Issue**:
   ```bash
   scripts/lanes/claim-issue.sh <issue-number> [agent-id]
   ```
2. **Cut an Isolated Worktree**:
   Do not work on standing lanes or dirty the main working tree. Run:
   ```bash
   scripts/lanes/cut-worktree.sh <issue-number> [short-intent]
   ```
   This automatically checks `docs/triage/issue-ownership.json`, pulls the correct lane, and provisions `.worktrees/work-<lane>-<issue>-<intent>`.
3. **Execute in Isolation**:
   Change into the worktree:
   ```bash
   cd .worktrees/work-<lane>-<issue>-<intent>
   ```
4. **Pre-PR Verification**:
   Before submitting, run:
   ```bash
   bash scripts/lanes/verify-agent-pr.sh
   ```
   Ensures Gates 01, 04, 05, TS lint, and secret hygiene pass.
5. **PR Description & Live Loop Receipt**:
   Fill out `docs/evidence/templates/live-loop-receipt.md` in your PR description. Target the PR to the **owning lane** (or `main` if trunk-ready).
6. **Post-Merge Cleanup**:
   Delete the working branch upon merge. Keep the standing lane.
