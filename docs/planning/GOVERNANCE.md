# Styx Governance Protocol: Blocked Handoffs

This document defines how blocked work that requires external human intervention is created, normalized, and audited.

## Scope

A "Blocked Handoff" is any task that cannot be completed by repository code changes alone (for example legal counsel, native platform approvals, external vendor onboarding, or partnership execution).

## Required Metadata

Every blocked handoff issue must have:

1. Label: `blocked`
2. At least one owner label: `owner:*`
3. A roadmap gate milestone
4. `target-date-v1` marker in the issue body

## Intake Automation

Use `.github/ISSUE_TEMPLATE/blocked_handoff.yml` to open blocked issues.

The intake guard (`.github/workflows/blocked-handoff-intake.yml`) automatically:

1. Parses owner role and milestone from issue-form fields
2. Applies the corresponding `owner:*` label if missing
3. Applies the selected milestone if it exists
4. Ensures the `target-date-v1` block exists
5. Posts/updates a normalization summary comment (`<!-- blocked-handoff-intake-v1 -->`)

## Weekly Audit and Burn-down

`.github/workflows/blocked-handoff-burndown.yml` runs every Monday at 13:00 UTC and can be triggered manually.

It performs three outputs:

1. Updates or creates the weekly burn-down issue (`<!-- blocked-handoff-burndown-v1 -->`)
2. Publishes a governance health audit section listing metadata drift
3. Regenerates blocked handoff index documents and commits changes

Tracking criteria in the burn-down is intentionally inclusive:

- `label:blocked` AND (`owner:*` label OR legacy range #123-#144)

This keeps legacy blockers visible while still auditing missing metadata as drift.

## Canonical Register Files

The generated handoff index is written to:

- `docs/planning/planning--blocked-handoff-index--YYYY-MM-DD.md`
- `docs/planning/planning--blocked-handoff-index--latest.md`

`--latest` is the canonical pointer, while date-stamped files preserve historical snapshots.
