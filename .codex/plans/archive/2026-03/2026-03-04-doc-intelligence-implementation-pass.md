# 2026-03-04 Doc Intelligence + Implementation Pass

## Objective
Ingest all documents in:
- `docs/research`
- `docs/planning`
- `docs/legal`
- `docs/brainstorm`

Then generate full traceability and implement high-impact uncovered functionality.

## Execution Steps
1. Inventory every file with hash, size, word count, and git first/last-touch metadata.
2. Parse text-bearing files into atomic elements (features, constraints, tasks, policies, unresolved questions, disputes).
3. Classify points of unity (cross-doc consensus) and points of contention (conflicting guidance).
4. Map extracted elements to current code paths and tests to produce `Implemented/Partial/Planned/Unmapped` statuses.
5. Implement highest-priority unmapped items from March 4 additions and Phase 1 beta blockers where feasible in this turn.
6. Persist generated logs and update backlog/status docs with explicit source references.
7. Run targeted tests and finalize drift summary.

## Artifacts to Produce
- `docs/planning/planning--doc-ingest-register.md`
- `docs/planning/planning--drift-check--2026-03-04.md`
- `docs/planning/planning--unity-contention-register--2026-03-04.md`
- `docs/planning/planning--implementation-worklog--2026-03-04.md`

## Notes
- Do not overwrite historical plans.
- Preserve generated reproducibility by adding script(s) under `scripts/`.
