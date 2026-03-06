# Contributing to Styx

## Getting Started

1. Clone the repo and run first-time setup:
   ```bash
   bash scripts/setup.sh
   ```
   This starts Docker (PostgreSQL + Redis), installs dependencies, builds, and runs tests.

2. For day-to-day development:
   ```bash
   make docker-up    # PostgreSQL + Redis
   make dev          # API (3000) + Web (3001) + Mobile (Metro)
   ```

3. Copy `.env.example` to `.env` and fill in required values (see CLAUDE.md for the full list).

## Development Workflow

### Branching

- `feat/description` for features
- `fix/description` for bug fixes
- `docs/description` for documentation
- Base all branches on `main`

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add fury bounty escalation logic
fix: prevent double-capture in escrow settlement
docs: update ADR-002 with FBO audit findings
chore: bump stripe SDK to 17.x
```

### Pull Requests

- All PRs require at least one review before merge
- PRs touching escrow (`src/api/services/escrow/`), ledger (`src/api/services/ledger/`), or payments (`src/api/src/modules/payments/`) require **two** reviewers (see `docs/adr/adr--002-fbo-escrow-model.md` for rationale)
- CI must pass: build, test, lint, and validation gates 04-07
- Describe what changed and why. Link related GitHub issues

### Code Review Focus Areas

For financial code (escrow, ledger, settlements):
- Verify double-entry balance invariants are maintained
- Check for race conditions in concurrent stake/capture flows
- Ensure no unbalanced ledger entries can be created
- Confirm hash-chain continuity is preserved

For Fury consensus code:
- Verify submitters cannot review their own proofs
- Check auditor anonymity is maintained through the routing layer
- Validate bounty calculations against spec constants

## Testing

Tests are co-located with source files:
- API: `*.spec.ts` (Jest + ts-jest)
- Web: `*.test.ts` / `*.test.tsx` (Jest)
- Mobile: `*.spec.tsx` (Jest + React Native Testing Library)

```bash
make test                              # all workspaces via turbo
cd src/api && npx jest                 # single workspace
cd src/api && npx jest --testNamePattern="should reject"  # by name
```

### Requirements

- New features must include tests
- Bug fixes must include a regression test
- API coverage thresholds: 70% lines, 60% branches, 60% functions, 70% statements
- Validation gates must pass (`scripts/validation/`)

## Architecture

Read `docs/adr/` for architectural decisions. Key structural detail: the API has two parallel directory trees:
- `src/api/services/` — domain logic (pure business rules, no HTTP)
- `src/api/src/modules/` — NestJS wiring (controllers, guards, DI)

Modules depend on services, never the reverse. See ADR-001 for details.

## Security

See `SECURITY.md` for the security policy and responsible disclosure process. Never commit secrets, credentials, or API keys.
