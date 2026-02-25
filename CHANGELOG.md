# CHANGELOG

## [0.2.0] - 2026-02-25
### Changed
- **GEMINI.md overhaul**: Fixed package manager (yarn→npm), desktop stack (Electron→Tauri 2.0), added `src/pitch` workspace, added Recovery Protocol, added AI tooling reference.
- **Node.js engine**: Standardized minimum to `>=20.0.0` across `package.json`, `README.md`, and CI matrix.
- **Deprecated BIOLOGICAL oath stream**: Marked `WEIGHT_MANAGEMENT`, `CARDIOVASCULAR_STAMINA`, `GLUCOSE_STABILITY`, `SLEEP_INTEGRITY`, `SOBRIETY_HRV` and `HEALTHKIT`/`HEALTHCONNECT` verification methods as `@deprecated` in `behavioral-logic.ts`.
- **Stripe production guard**: `StripeFboService` now throws on startup if `NODE_ENV=production` and `STRIPE_SECRET_KEY` is missing or mock.
- **ConsensusEngine bounty distribution**: Wired `LedgerService` integration to pay Furies via `FURY_BOUNTY_POOL` account after consensus.
- **Terraform remote state**: Added S3-compatible backend block for Cloudflare R2 state storage.

### Added
- **`GoalEthicsService`** (`src/api/services/intelligence/goal-ethics.service.ts`): Moved goal ethics screening from `shared/` to `api/` to fix `shared→api` dependency inversion.
- **`FuryRouterWorker`** (`src/api/services/fury-router/fury-router.worker.ts`): BullMQ worker that processes Fury review routing jobs — selects eligible auditors, creates `fury_assignments`, and updates proof status.
- **`BannedUserGuard`** (`src/api/src/guards/banned-user.guard.ts`): NestJS guard that prevents banned users from accessing mutation endpoints.
- **`LedgerService` read-path**: `getAccountBalance()`, `getContractLedger()`, `verifyLedgerIntegrity()` methods for balance queries and Phantom Money Test.
- **`isOathStreamActive()`**: Runtime check for whether an oath category is supported in the current MVP.
- **`ACTIVE_OATH_STREAMS`**: Constant array of active oath streams (`COGNITIVE`, `PROFESSIONAL`, `CREATIVE`, `RECOVERY`).
- **Data retention policy**: Added retention schedule to `SECURITY.md` covering event_log, proofs, notifications, fury_assignments, stripe_events, and user PII.

### Removed
- **`isGoalEthical()`** from `shared/libs/behavioral-logic.ts` (replaced by `GoalEthicsService` in API layer).
- **Unused `FRAUD_PENALTY` import** from `consensus.engine.ts`.

## [0.1.0] - 2026-02-23
### Added
- **Security hardening**: Helmet HTTP security headers, JWT secret enforcement in production (no fallback), `SECURITY.md` vulnerability disclosure policy.
- **OpenAPI/Swagger**: Interactive API documentation at `/api/docs` with `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`, and `@ApiProperty` decorators across all controllers and DTOs.
- **Database migrations**: Migration runner (`migrate.ts`) with `schema_migrations` tracking table, `001_initial_schema.sql` baseline, and `npm run migrate` script.
- **Structured logging**: Pino integration via `nestjs-pino` — JSON output in production, pretty-print in development, automatic HTTP request logging.
- **README rewrite**: Updated test count (~430), Node.js prerequisite (>= 20), React Native version (0.76), CI badges, Swagger docs link, security link, migration command.

## [0.0.1] - 2026-02-22
### Added
- Initial monorepo skeleton.
- Architecture documentation.
- Legal guardrail definitions.
- Platform-specific build instructions.
