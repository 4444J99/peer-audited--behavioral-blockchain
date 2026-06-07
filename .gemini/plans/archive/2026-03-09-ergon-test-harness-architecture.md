# Architecture: Ergon Test Harness (`ergon-test-harness`)
# Date: 2026-03-09
# Workstreams: 4, 5, 6, 7 (SHAPE Phase Completion)

## 1. System Design (Workstream 4)

### 1.1. Execution Model
The `ergon-test-harness` is a **Pluggable CLI Utility** built in TypeScript.
*   **Local Mode**: Developers run `ergon-test --repo <path>` to validate changes before pushing.
*   **Ecosystem Mode**: Integrated as a GitHub Action across all ORGAN-III repositories, triggered by the `seed.yaml` agent contract.

### 1.2. Component Architecture
*   **Orchestrator**: Discovers the target repository, parses its `seed.yaml`, and registers applicable analyzers.
*   **Analyzer Engine**: Executes validation logic in parallel.
*   **Signal Dispatcher**: Collects results and broadcasts them to the ecosystem event bus (ORGAN-IV/VI).

## 2. Interface & Schema (Workstream 5)

### 2.1. `ValidationResult` Schema
```typescript
interface ValidationResult {
  metadata: {
    repo: string;
    organ: "III";
    timestamp: string; // ISO8601
  };
  summary: {
    status: "SUCCESS" | "FAILURE" | "DEGRADED";
    score: number; // 0-100
  };
  details: Array<{
    analyzer: "seed" | "aesthetic" | "behavioral" | "aegis";
    check: string;
    status: "PASS" | "FAIL";
    message?: string;
    artifacts?: string[]; // Paths to screenshots/logs
  }>;
}
```

### 2.2. Event Bus Payload (`community_signal`)
Dispatched to `organvm-vi-koinonia/community-hub`:
```json
{
  "event": "audit.completed",
  "source": "ergon-test-harness",
  "payload": {
    "repo": "peer-audited--behavioral-blockchain",
    "status": "FAILURE",
    "failing_checks": ["aesthetic-palette-mismatch"]
  }
}
```

## 3. Technology Stack (Workstream 6)

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v25+) | Ecosystem consistency. |
| **Language** | TypeScript (Strict) | Type safety for complex validation logic. |
| **CLI Framework** | `commander` | Lightweight and standard. |
| **Schema Validation** | `zod` | Runtime validation of `seed.yaml` and signals. |
| **UI Auditing** | `playwright` | Robust headless browser support for visual regression. |
| **Test Runner** | `vitest` | High-speed, ESM-native testing. |

## 4. Project Scaffolding (Workstream 7)

```text
ergon-test-harness/
├── .github/workflows/  # CI and Ecosystem CD
├── bin/
│   └── ergon-test      # CLI executable
├── src/
│   ├── index.ts        # Entry point
│   ├── core/           # Orchestration & Discovery logic
│   ├── analyzers/      # Modular audit logic
│   │   ├── seed/       # seed.yaml parser & validator
│   │   ├── aesthetic/  # Playwright visual auditors
│   │   ├── behavioral/ # Economic stress-test simulators
│   │   └── aegis/      # Regulatory/Gatekeeper checks
│   ├── reporters/      # JSON, Markdown, and Webhook dispatchers
│   ├── types/          # Shared interfaces
│   └── utils/          # Config, logging, and filesystem helpers
├── tests/              # Unit & Integration tests for the harness
├── Makefile            # Standard lifecycle commands
├── seed.yaml           # Automation contract
└── package.json
```

## 5. Next Steps
1.  Initialize the repository structure (**BUILD** phase).
2.  Implement the `seed.yaml` validator as the MVP.
3.  Draft the Playwright base classes for the aesthetic auditor.
