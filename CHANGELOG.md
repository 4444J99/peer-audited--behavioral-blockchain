# CHANGELOG

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
