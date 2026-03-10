# 2026-03-04 Second Pass: Unresolved Research -> Executable Tickets

## Objective
Translate deeper unresolved research and partial controls into implementation-ready tickets with explicit API/schema/UI diffs and legal/compliance gating.

## Inputs
- `docs/FEATURE-BACKLOG.md`
- `docs/planning/planning--implementation-status.md`
- `docs/planning/planning--drift-check--2026-03-04.md`
- `docs/planning/planning--unity-contention-register--2026-03-04.md`

## Ticketization Framework
1. Select unresolved items with highest launch/compliance risk and concrete code adjacency.
2. Resolve documented contention by choosing one explicit path per ticket.
3. For each ticket, define:
   - API diff
   - Schema migration diff
   - UI diff (web/mobile/desktop)
   - Legal/compliance gate checklist
   - Acceptance criteria and test matrix
4. Sequence tickets by dependency order and execution lane.

## Deliverable
- `docs/planning/planning--research-ticket-pack--2026-03-04.md`

## Constraints
- Preserve MVP legal posture (skill-based framing, geofencing, responsible-use controls).
- Avoid speculative external dependencies without fallback path.
- Keep tickets implementation-sized and independently mergeable where possible.
