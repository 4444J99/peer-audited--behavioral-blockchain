# Pragma: The Concrete State of Styx

## Current Manifestation (2026-06-07)
Styx exists as a TypeScript-based monorepo managed by Turborepo.

### Functional Core
- **API**: NestJS backend with PostgreSQL double-entry ledger, BullMQ/Redis worker queues, and Sentry financial integrity monitoring.
- **Web**: Next.js dashboard for consumers, accountability partners, and auditors.
- **Mobile**: React Native application with grounded `expo-camera` (`CameraView`) live viewfinder, live SHA-256 media hashing, and offline ZK privacy validation.
- **Desktop**: Tauri admin interface for dispute resolution and collusion ring triage.

### Recent Hardening
- **Double-Entry Enforcement**: `STAKE_SLASH` penalties post real compensating debits from auditor accounts to `SYSTEM_REVENUE`.
- **Financial Invariant Monitoring**: Sentry financial alerts wired to ledger quarantines and catastrophic outbox failures.
- **Native Camera Attestation**: Integrated `expo-camera` with live sensor viewfinder, zero gallery access, and cryptographic watermarks.
- **Validation Gates**: Enforced non-bypassable CI gates, Gate 04 linguistic cloaking, Gate 05 behavioral physics, Gate 07 claim drift, and Gate 08 Fury crucible.

## Technical Debt
- **Session Export Persistence**: Systemic vacuum in `organvm` where exports can land in non-git paths (IRF-OPS-093).
- **Logos Symmetry**: The documentation layer is actively maintained at 1.0 symmetry across all four tetradic counterparts.

