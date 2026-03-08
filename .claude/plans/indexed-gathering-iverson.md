# Plan: Tame the Styx GitHub Project — from chaotic sprawl to operational board

**Date:** 2026-03-06
**Project:** `peer-audited--behavioral-blockchain` (Styx)
**Board:** [Styx Artifact Dissection](https://github.com/orgs/organvm-iii-ergon/projects/2) (org project #2)

---

## Context

The project board has grown organically through AI-assisted triage sessions, producing 221 open issues and a project board that's become an "endless sprawl." Diagnosis:

| Problem | Evidence |
|---------|----------|
| **125 issues orphaned** | 221 open issues, only 96 on the board |
| **90/96 items stuck at "Todo"** | Only 2 "In Progress", 4 "Done" — board is static |
| **No priority field** | Can't distinguish P0-blockers from P3-nice-to-haves |
| **No effort/size field** | Can't plan capacity or estimate work |
| **189/221 issues have no milestone** | No timeline visibility |
| **Generic views** | "View 1" (table), "View 2" (board), "View 3" (roadmap) — unnamed, unfiltered |
| **42 labels** | Label sprawl — duplicates concern axes that should be fields |
| **Category field is misleading** | 91 of 96 items = "A-Plans"; provides no differentiation |

**What's working:** Source Plan field (12 options, fully populated), 6 automations enabled, issue templates exist, milestones defined with gates.

## Plan

### Step 1: Add Priority field (single-select)

Add to project: `Priority` with options:
- `P0-blocker` — must-have for beta gate
- `P1-high` — should-have for beta
- `P2-medium` — post-beta
- `P3-backlog` — nice-to-have / may archive

**Bulk-set from existing labels** (already labeled):
- `P0-beta-blocker` (3 issues) → P0
- `P1-beta-enhancer` (24 issues) → P1
- `P2-post-beta` (62 issues) → P2
- Remainder → P3

### Step 2: Add Effort field (single-select)

Options: `XS` (<1h), `S` (1-3h), `M` (half-day), `L` (1-2 days), `XL` (3+ days)

Leave blank initially — populate as items enter sprints. Don't burn time sizing 221 issues at once.

### Step 3: Add Target Date field (date)

For milestone-gated items, set Target Date from milestone due dates:
- Beta Gate items → `2026-04-30`
- Gamma Gate items → `2026-06-30`
- Delta Gate items → `2026-09-30`
- Omega items → `2026-12-31`

### Step 4: Rename and configure views (replace "View 1/2/3")

| View | Layout | Filter/Group | Purpose |
|------|--------|-------------|---------|
| **Sprint Board** | Board | Status columns, sorted by Priority | Daily execution |
| **Backlog** | Table | `Status != Done`, sorted by Priority desc | Prioritized queue |
| **Roadmap** | Roadmap | Target Date field, grouped by Source Plan | Timeline visibility |
| **By Epic** | Table | Grouped by Source Plan | Epic progress tracking |
| **Needs Triage** | Table | `Priority = EMPTY` or `Status = Todo` for 60+ days | Weekly hygiene |
| **Beta Gate** | Table | Milestone = "Beta Gate", sorted by Priority | Release focus |

### Step 5: Add all 125 orphaned issues to this project board

Query all 221 open issues, diff against the 96 already on the board, bulk-add the missing 125 via `addProjectV2ItemById`. Then set Priority from their existing labels (P0/P1/P2 labels → matching field values; unlabeled → P3).

### Step 6: Archive stale/completed items

- Archive the 4 closed items (session transcripts + MEMORY.md chore)
- Identify any issues that are clearly done or obsolete among the 221

### Step 7: Update project metadata

- Set project `shortDescription`: "Styx: peer-audited behavioral market — product backlog & roadmap"
- Set project `readme` with field definitions, view purposes, triage cadence

## Files Modified

No codebase files modified — all changes are GitHub API mutations against the project board.

## Implementation Notes

- **Project ID:** `PVT_kwDODwtKPs4BRAoV`
- **Existing field IDs:** Status `PVTSSF_lADODwtKPs4BRAoVzg-9v8U`, Category `PVTSSF_lADODwtKPs4BRAoVzg-9v84`, Source Plan `PVTSSF_lADODwtKPs4BRAoVzg-9v88`
- **API:** `gh api graphql` for all mutations (createProjectV2Field, updateProjectV2ItemFieldValue, addProjectV2ItemById, updateProjectV2)
- Views must be created via the GitHub UI or undocumented GraphQL — will use `gh` CLI where possible, manual for views
- Bulk operations: batch script pattern (same as Source Plan restore — iterate issues, call mutation per item)

## Verification

1. `gh api graphql` query: all items have Priority field populated → 0 EMPTY
2. Total items on board = total open issues (221+)
3. Views render correctly with filters (manual check)
4. Roadmap view shows items distributed across Q2-Q4 timeline
5. "Needs Triage" view returns a manageable set (target: <20 items)
