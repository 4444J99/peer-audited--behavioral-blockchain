# Phase α: Foundation Setup

## Objective

Initialize monorepo infrastructure with shared packages, build orchestration, and CI/CD pipeline.

---

## Implementation Plan

### Step 1: Initialize pnpm Workspace

```bash
# At project root
pnpm init
```

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'contracts'
```

### Step 2: Configure Turborepo

Install and configure:
```bash
pnpm add -D turbo
```

Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Step 3: Create Directory Structure

```
meta-source--ledger-output/
├── apps/
│   ├── identity-playground/    (existing, update)
│   └── cipher-rendering/       (existing, update)
├── packages/
│   ├── core/                   (NEW - shared types)
│   ├── utils/                  (NEW - math, color, validation)
│   └── config/                 (NEW - shared configs)
├── contracts/                  (NEW - Phase 5 Solidity)
├── pnpm-workspace.yaml         (NEW)
├── turbo.json                  (NEW)
├── package.json                (UPDATE)
└── tsconfig.json               (UPDATE - project references)
```

### Step 4: Create @meta-source/core Package

`packages/core/package.json`:
```json
{
  "name": "@meta-source/core",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

Core types from specs:
- `PersonalIdentity` (Phase 1)
- `NumerologyProfile` (Phase 1)
- `CipherState`, `ICipher` (Phase 2)
- `MythologyToken`, `FourAsState` (Phase 3)
- `CreativeIdentity` (Phase 4)
- `UniversalState` (Phase 5)

### Step 5: Create @meta-source/utils Package

Shared utilities:
- `math.ts` - PHI constant, digitSum, reduce
- `color.ts` - hue conversions, palette generation
- `validation.ts` - input validators
- `hash.ts` - deterministic seed generation

### Step 6: Create @meta-source/config Package

Shared configurations:
- `tsconfig.base.json`
- `eslint.config.js`
- `prettier.config.js`

### Step 7: Update Existing Apps

Modify `apps/identity-playground` and `apps/cipher-rendering`:
- Update imports to use `@meta-source/core`
- Update imports to use `@meta-source/utils`
- Add workspace dependency references

### Step 8: Configure CI/CD

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm turbo build lint typecheck test
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `pnpm-workspace.yaml` | CREATE |
| `turbo.json` | CREATE |
| `package.json` (root) | UPDATE - add turbo, workspaces |
| `tsconfig.json` (root) | UPDATE - project references |
| `packages/core/package.json` | CREATE |
| `packages/core/tsconfig.json` | CREATE |
| `packages/core/src/index.ts` | CREATE |
| `packages/core/src/types/*.ts` | CREATE |
| `packages/utils/package.json` | CREATE |
| `packages/utils/src/*.ts` | CREATE |
| `packages/config/*` | CREATE |
| `.github/workflows/ci.yml` | CREATE |
| `apps/*/package.json` | UPDATE - workspace deps |

---

## Verification

1. `pnpm install` succeeds at root
2. `pnpm turbo build` builds all packages
3. `pnpm turbo lint` passes
4. `pnpm turbo typecheck` passes
5. Apps can import from `@meta-source/core`
6. CI workflow runs on push

---

## Estimated Effort

~2-3 hours for initial setup and verification
