# Plan: Financial Logic Map And Beta Cut Plan

Date: 2026-03-09

## Objective

Produce two repo-backed working documents:

1. a single financial logic map covering arithmetic, money handling, and finance-adjacent process flows
2. a beta cut plan defining what to hide, disable, or keep to ship the current Phase 1 beta quickly

## Inputs Reviewed

- global and project agent instructions
- `docs/planning/planning--phase1-private-beta-scope.md`
- `docs/planning/planning--beta-readiness-contract.md`
- `docs/FEATURE-BACKLOG.md`
- payment, ledger, contract, wallet, mobile, web, and beta-flag code paths

## Deliverables

- `docs/planning/planning--financial-logic-map--2026-03-09.md`
- `docs/planning/planning--beta-cut-plan--2026-03-09.md`

## Working Conclusions

- the repo does not currently have one clean financial truth; stake units are mixed across dollars and cents
- current Phase 1 fastest path remains iOS + No-Contact + test-money + US allowlist
- several surfaces should be hidden rather than fixed for beta: Fury, Tavern, B2B/HR, public pitch/ask, desktop operator tools
- the mobile create-contract payload and synthetic camera flow are higher-value launch blockers than broader feature completeness

## Constraints

- docs-only pass
- do not touch unrelated dirty files
- preserve plan history in `.codex/plans/`
