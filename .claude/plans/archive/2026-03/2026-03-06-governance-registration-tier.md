# Plan: Styx Business Organism — Structural Integrity Audit Against ORGANVM Governance

## Context

A previous Claude Code session (2026-03-06) ran an exhaustive "full-breath audit" on `peer-audited--behavioral-blockchain` (Styx). It produced 29 new tests, an E2G report, 8 GitHub issues, 5 ADRs, community health files (CONTRIBUTING/SECURITY/CODE_OF_CONDUCT), organ-level governance policies, and 7 specialist agent departments (`.claude/agents/{enterprise,product,growth,support,ops,finance,legal}/`).

The user's concern: **did this expansion break the ORGANVM governance model?** The system has clear rules about what lives where — and stuffing an entire virtual company into a single ORGAN-III repo may violate those rules.

## Critical Finding: Styx Is Not In The Registry

`peer-audited--behavioral-blockchain` does NOT exist in `registry-v2.json`. The registry lists 27 ORGAN-III repos, but Styx is not among them. It exists:
- On GitHub: `organvm-iii-ergon/peer-audited--behavioral-blockchain` (public, created 2026-02-22)
- Locally: `~/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/` (159 commits)
- In seed.yaml: organ III, tier standard, PUBLIC_PROCESS
- In the organ CLAUDE.md: acknowledged as "standalone — not a submodule"
- **NOT in registry-v2.json** — the single source of truth

This means the system doesn't know this repo exists. No metrics, no governance tracking, no promotion pipeline.

## Structural Violations Identified

### 1. REGISTRY ABSENCE (Critical)
Styx has never been registered. The system cannot govern what it cannot see.

### 2. ROLE CONFUSION: Repo vs. Organ vs. System
The ORGANVM model has clear layers:

| Layer | Governance Owner | Example |
|-------|-----------------|---------|
| **Repo** | Code, tests, local docs | `peer-audited--behavioral-blockchain/` |
| **Organ** | Cross-repo policies, governance | `commerce--meta/governance/` |
| **System** | Registry, schemas, dependency graph | `organvm-corpvs-testamentvm/` |
| **Orchestration** | Workflows, agents, skills | `organvm-iv-taxis/` |

The previous session created artifacts at **all four levels from within a single repo session**, some of which are correctly placed and some of which are questionable:

#### Correctly Placed (in the repo)
- Test files (co-located with source) — correct
- E2G report in `docs/planning/` — correct
- ADRs in `docs/adr/` — correct
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md — correct
- GitHub issues on the repo — correct
- `.claude/agents/` department contexts — **novel but acceptable** (repo-scoped agent config)
- `docs/research/` (50+ files) — correct for a product repo
- `docs/thesis/` (33 files with formal proofs) — correct, unique to this repo
- `docs/legal/` (6 files) — correct for a financial product
- `scripts/validation/` (8 gates) — correct and excellent
- `infra/terraform/` — correct

#### Correctly Placed (at organ level, in commerce--meta)
- `governance/policies/code-review-policy.md` — correct (organ-wide policy)
- `governance/policies/security-audit-cadence.md` — correct (organ-wide policy)

#### No Placement Violations Found
The session actually placed things correctly. The **concern is not misplacement — it's that Styx has organically grown into something that transcends the "standard tier repo" classification** without the registry knowing.

### 3. THE REAL ISSUE: Styx Is a Flagship, Not Standard Tier

The seed.yaml says `tier: standard`. But Styx has:
- 499+ tests (most tested repo in the entire system by far)
- 147 doc files (more than most organs combined)
- 7 CI workflows
- 8 validation gates + 8 smoke scripts
- A formal academic thesis with 9 theorem proofs
- 50+ research documents
- 7 specialist agent departments
- Terraform IaC
- 30 open issues with structured governance (blocked handoffs)
- 159 commits

This is not "standard." This is a **flagship** repo that has outgrown its classification.

### 4. SUBMODULE QUESTION
The organ CLAUDE.md explicitly notes Styx is "standalone — not a submodule." Every other tracked repo in ORGAN-III is a submodule. This is an intentional exception but creates governance drift.

## What Needs To Happen

### Part 1: Register Styx in registry-v2.json
**File**: `~/Workspace/meta-organvm/organvm-corpvs-testamentvm/registry-v2.json`

Add a new entry to ORGAN-III repositories:
```json
{
  "name": "peer-audited--behavioral-blockchain",
  "org": "organvm-iii-ergon",
  "status": "ACTIVE",
  "public": true,
  "tier": "flagship",
  "description": "Styx: peer-audited behavioral market using loss aversion and financial stakes",
  "documentation_status": "DEPLOYED",
  "portfolio_relevance": "primary",
  "implementation_status": "ACTIVE",
  "type": "SaaS",
  "revenue_model": "commission",
  "revenue_status": "pre-revenue"
}
```

Update `repository_count` from 27 → 28, update `total_repos` in summary, update `implementation_status_distribution`.

### Part 2: Promote seed.yaml tier
**File**: `~/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/seed.yaml`

Change `tier: standard` → `tier: flagship`

### Part 3: Create the Replication Pattern Document

This is the "business organism" pattern extracted from Styx. It belongs in **the corpus** (`organvm-corpvs-testamentvm/docs/standards/`) because it defines a system-level standard for how any ORGAN-III repo can grow into a full business organism.

**File**: `~/Workspace/meta-organvm/organvm-corpvs-testamentvm/docs/standards/12-habitat-governance-lifecycle.md`

Content structure:
1. **Definition**: What a "business habitat" is — a repo that has grown beyond code to include all limbs of a venture
2. **The Seven Departments** (extracted from Styx's `.claude/agents/`): enterprise, product, growth, support, ops, finance, legal
3. **Directory anatomy**: Where each department's artifacts live within a repo vs. at the organ level vs. at system level
4. **Governance escalation**: When a repo outgrows "standard" tier → triggers for flagship promotion
5. **Registry requirements**: What fields must be added/updated when a repo becomes a habitat
6. **Organ-level propagation**: What policies belong in `commerce--meta` vs. the repo itself
7. **Cross-organ signals**: How a habitat repo's produce/consume edges should be declared in seed.yaml

This document codifies the pattern so it can be replicated for `life-my--midst--in` or any future ORGAN-III product.

### Part 4: Organizational Topology Map

Add a section to the habitat standard (or as a standalone doc) mapping every Styx artifact to its governance layer:

```
REPO LAYER (peer-audited--behavioral-blockchain/)
├── src/                      # Application code + co-located tests
├── docs/planning/            # E2G reports, timelines, blocked handoffs
├── docs/adr/                 # Architecture Decision Records
├── docs/research/            # Product research, competitor analysis
├── docs/thesis/              # Academic thesis + formal proofs
├── docs/legal/               # Product-specific legal analysis
├── docs/architecture/        # System specs, feasibility studies
├── scripts/validation/       # Quality gates (run in CI)
├── scripts/smoke/            # Deployment verification
├── infra/terraform/          # Infrastructure as Code
├── .github/workflows/        # CI/CD pipelines
├── .claude/agents/           # Department-specific agent contexts
├── CONTRIBUTING.md           # Contribution guidelines
├── SECURITY.md               # Security policy
├── CODE_OF_CONDUCT.md        # Community standards
├── seed.yaml                 # Automation contract
└── Makefile                  # Build/test/dev commands

ORGAN LAYER (commerce--meta/)
├── governance/policies/      # Cross-repo policies (code review, audit cadence)
├── governance/decision-log   # Organ-wide decisions
├── contracts/                # Legal templates
├── financial/                # Revenue frameworks, pricing
└── ip/                       # Intellectual property

SYSTEM LAYER (organvm-corpvs-testamentvm/)
├── registry-v2.json          # Single source of truth for all repos
├── governance-config.yaml    # Organ→directory→org mapping
├── code-substance-report.json # System health metrics
└── docs/standards/           # Cross-organ standards (including this pattern)

ORCHESTRATION LAYER (organvm-iv-taxis/)
├── orchestration-start-here/ # Entry point, shared workflows
├── a-i--skills/              # Skill library (evaluation-to-growth, etc.)
└── domus-semper-palingenesis/ # Environmental controller
```

### Part 5: Run system sync
- `organvm registry validate` — will now catch the new entry
- `organvm metrics calculate` — update code-substance-report.json
- `organvm seed validate` — verify seed.yaml consistency

## Files to Create/Modify

| # | File | Action | Layer |
|---|------|--------|-------|
| 1 | `organvm-corpvs-testamentvm/registry-v2.json` | Add Styx entry, bump counts | System |
| 2 | `peer-audited--behavioral-blockchain/seed.yaml` | tier: standard → flagship | Repo |
| 3 | `organvm-corpvs-testamentvm/docs/standards/12-habitat-governance-lifecycle.md` | Create: business organism pattern + topology map | System |

## Verification

1. `organvm registry validate` — passes with new entry
2. `organvm seed validate` — seed.yaml tier matches registry
3. `organvm metrics calculate` — Styx appears in system metrics
4. `grep -c "peer-audited" registry-v2.json` returns 1
5. New standard doc has no broken internal links
6. Registry total_repos updated correctly (97 → 98 or current count + 1)

## What Does NOT Need To Change

- The `.claude/agents/` department structure — novel but correctly scoped to the repo
- The docs/ subdirectory structure — rich but all correctly placed
- The organ-level policies — already correctly in commerce--meta
- The E2G report — correctly in docs/planning/
- The GitHub issues — correctly on the repo
- No files need to be moved between layers

## Summary

The previous session didn't break the ORGANVM model. It built correctly at each layer. The actual violation is **the registry doesn't know Styx exists** — and the tier classification (`standard`) is wrong for a repo of this magnitude. The fix is registration + promotion + codification of the pattern for reuse.
