# Contributing to Styx

Thank you for your interest in contributing to the Blockchain of Truth. This guide covers everything you need to get started.

## Principles

1. **Zero Trust** — Verify all inputs. Trust no client. All validation is server-side.
2. **Double-Entry Integrity** — Every financial mutation must be a balanced debit/credit pair.
3. **Test-Driven** — No code merges without tests for changed behavior.
4. **Conventional Commits** — All commits follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Development Setup

### Prerequisites

- Node.js >= 20
- Docker (for PostgreSQL + Redis)
- npm 10+

### Getting Started

```bash
# Start infrastructure
docker-compose up -d

# Install all workspace dependencies
make install

# Run database migrations
cd src/api && npm run migrate && cd ../..

# Start all dev servers (API + Web + Mobile)
make dev
```

### Workspace Structure

| Workspace | Port | Command |
|-----------|------|---------|
| `src/api` | 3000 | `cd src/api && npm run dev` |
| `src/web` | 3001 | `cd src/web && npm run dev` |
| `src/mobile` | Metro | `cd src/mobile && npm start` |
| `src/desktop` | Vite | `cd src/desktop && npm run dev` |

API docs are available at `http://localhost:3000/api/docs` when the API is running.

## Making Changes

### Branch Strategy

```
main              # Production-ready, protected
feat/<name>       # New features (e.g., feat/fury-bounty-ui)
fix/<name>        # Bug fixes (e.g., fix/ledger-race)
docs/<name>       # Documentation changes
chore/<name>      # Maintenance, dependencies
```

### Commit Messages

```
type(scope): subject

# Examples:
feat(fury): add cross-lobby auditing
fix(ledger): prevent phantom money on failed stake
test(contracts): add attestation flow coverage
docs(readme): update test counts
chore(deps): bump nestjs to v11.1
```

Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`, `style`

### Code Style

- **TypeScript**: Strict mode, named exports, async/await over raw Promises
- **NestJS**: `@Injectable()` classes with constructor DI; mock via `as any` in tests
- **Files**: kebab-case; double-hyphen separates function from descriptor
- **Formatting**: Prettier (run `npm run format` before committing)
- **Linting**: `npx turbo run lint` must pass (strict `tsc --noEmit`)

### Testing

Every PR must include tests for changed behavior.

```bash
make test                                          # All workspaces
cd src/api && npx jest path/to/file.spec.ts        # Single file
npx jest --testNamePattern="should reject"         # Single test by name
```

Test files are co-located as `*.spec.ts` (API, mobile, desktop) or `*.test.tsx` (web).

### Validation Gates

These run in CI and can be run locally:

```bash
bash scripts/validation/04-redacted-build-check.sh        # No gambling terms in build
node scripts/validation/07-claim-drift-check.js            # Docs match code paths
npx tsx scripts/validation/05-behavioral-physics-check.ts  # Algorithm constants correct
```

## Pull Request Process

1. Fork the repository and create a feature branch.
2. Make your changes with tests.
3. Run `make test` and `npx turbo run lint` locally.
4. Open a Pull Request using the PR template.
5. Address review feedback.
6. A maintainer will merge once CI passes and review is approved.

### PR Checklist

- [ ] Tests added/updated for changed behavior
- [ ] `make test` passes
- [ ] `npx turbo run lint` clean
- [ ] No secrets or credentials committed
- [ ] CLAUDE.md updated if architecture changed
- [ ] CHANGELOG.md updated for user-facing changes

## Architecture Notes

The API has **two parallel directory trees** — understand this before contributing:

- **`src/api/services/`** — Domain services (pure business logic, no HTTP)
- **`src/api/src/modules/`** — NestJS modules (controllers, route handlers, DI wiring)

Domain services are imported by modules. Controllers call services. Tests mock services to test controllers in isolation.

## Security

- Never commit secrets, API keys, or credentials.
- Report vulnerabilities via [SECURITY.md](SECURITY.md), not public issues.
- All financial logic changes require review from `@labores-profani-crux/styx-core`.

## Questions?

- Check [SUPPORT.md](SUPPORT.md) for help channels.
- Open a [Discussion](../../discussions) for questions or ideas.
