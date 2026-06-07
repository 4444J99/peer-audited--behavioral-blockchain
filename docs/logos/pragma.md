# Pragma: The Concrete State of Styx

## Current Manifestation (2026-06-07)
Styx exists as a TypeScript-based monorepo managed by Turborepo.

### Functional Core
- **API**: NestJS backend with PostgreSQL ledger and BullMQ/Redis worker queues.
- **Web**: Next.js dashboard for consumers and auditors.
- **Mobile**: React Native preview path for beta users (native camera bridge pending).
- **Desktop**: Tauri admin interface for dispute resolution.

### Recent Hardening
- **Local Dev Sync**: Environment configuration has been unified across root and workspaces via `scripts/dev/env.mjs`.
- **Validation Gates**: CI pipeline enforces mandatory environment variables and behavioral physics checks.
- **Hall-Monitor Audit**: All changes are verified against the Minimal Root philosophy and add-only constraints.

## Technical Debt
- **Mobile Camera Bridge**: Native implementation for iOS/Android is currently synthetic.
- **Session Export Persistence**: Systemic vacuum in `organvm` where exports can land in non-git paths (IRF-OPS-093).
- **Logos Symmetry**: The documentation layer was previously a vacuum (Status: MISSING); currently being scaffolded.
