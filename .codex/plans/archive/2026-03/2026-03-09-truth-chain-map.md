## Truth Chain Map Plan

Date: 2026-03-09

### Why This Exists

The current project board and partner-facing planning docs are useful as dashboards, but they do not establish a clean source-of-truth hierarchy. During partner review, several critical blockers were found to have drift between:

- source research/legal documents
- `docs/FEATURE-BACKLOG.md`
- execution tickets in planning docs
- blocked-handoff GitHub issues
- actual code/runtime evidence

This plan creates a truth-chain map so launch decisions can be made from evidence instead of projections.

### Deliverable

Create `docs/planning/planning--truth-chain-map--2026-03-09.md` with:

1. A precedence model defining what counts as truth.
2. A chain model: source doc -> feature -> execution ticket -> blocker issue -> runtime/external evidence.
3. A blocker-by-blocker map for the concrete Beta gates.
4. A drift register calling out contradictions that require cleanup.

### Scope

Focus on concrete Beta blockers and adjacent gating artifacts:

- `#123` native camera
- `#132` KYC / identity verification
- `#133` merchant account / production settlement
- `#136` skill-based contest whitepaper
- `#141` App Store Connect + TestFlight provisioning
- `#146` App Store UGC moderation package

### Intended Outcome

After this doc exists, partner conversations should use:

- source docs + `FEATURE-BACKLOG.md` for product/legal intent
- code/tests + `planning--implementation-status.md` for implemented reality
- GitHub blocked-handoff issues for external human work
- explicit artifact evidence for go/no-go decisions

The project board should be treated as a dashboard only.
