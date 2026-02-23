# ADR-001: Dual-Layer Architecture (Services / Modules)

## Status

Accepted

## Context

The Styx API needs to separate pure business logic from HTTP transport and NestJS-specific wiring. This decision arose during the initial architecture phase when we recognized that domain services (ledger operations, fury routing, escrow management) needed to be testable in isolation without NestJS decorators, controllers, or HTTP concerns.

## Decision

We use two parallel directory trees inside `src/api/`:

```
src/api/
├── services/       ← Domain layer (pure business logic)
│   ├── ledger/
│   ├── fury-router/
│   ├── escrow/
│   ├── health/
│   ├── intelligence/
│   ├── security/
│   ├── anomaly/
│   ├── storage/
│   └── realtime/
│
└── src/modules/    ← Application layer (NestJS controllers, DI wiring)
    ├── auth/
    ├── contracts/
    ├── fury/
    ├── wallet/
    ├── b2b/
    ├── ai/
    ├── admin/
    ├── users/
    ├── notifications/
    ├── payments/
    └── health/
```

**Rules:**

1. **Domain services** (`services/`) are `@Injectable()` classes that receive dependencies (e.g., `Pool`, queues, external clients) via constructor injection. They contain zero HTTP-specific logic (no `@Controller`, `@Get`, `Request`, `Response`).

2. **Modules** (`src/modules/`) are NestJS modules that wire controllers to domain services. Controllers handle HTTP concerns (validation, guards, decorators, response formatting) and delegate to domain services.

3. **Direction of dependency**: Modules depend on services, never the reverse. Services do not import from modules.

4. **Testing**: Domain services are tested with mock injections (mock `Pool`, mock queues). Module/controller tests additionally mock the domain services themselves.

## Consequences

**Positive:**
- Domain logic is unit-testable without NestJS testing module
- Clear separation makes code review easier — reviewers can focus on business logic or transport independently
- Services are reusable across modules (e.g., `TruthLogService` used by both `ContractsModule` and `AdminModule`)

**Negative:**
- Two directory trees can confuse new contributors who expect a single modules/ tree
- Some duplication in import paths (controllers must import from `../../../services/`)

## Alternatives Considered

1. **Single modules/ tree** with co-located services — rejected because it couples domain logic to NestJS module boundaries.
2. **Separate `@styx/domain` package** — considered but deferred as premature for current monorepo size.
