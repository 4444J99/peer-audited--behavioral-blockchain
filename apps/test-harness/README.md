# Ergon Test Harness (@styx/test-harness)

The definitive quality gate for the Commerce Organ (ORGAN-III).

## Overview
This package provides automated validation for all ORGAN-III (Ergon) repositories. It ensures that every SaaS product and utility is architecturally compliant, aesthetically aligned, and economically sound.

## Key Audit Suites
- **Contract Validator**: Validates `seed.yaml` files and cross-organ integration edges.
- **Aesthetic Auditor**: Headless UI auditing using Playwright to ensure adherence to the Ergon Style Guide (Navy/Charcoal/White palette).
- **Economic Simulator**: Monte Carlo simulations for behavioral markets (e.g., loss-aversion stress testing).
- **Aegis Gatekeeper**: Ensures mandatory legal guardrails and age-gates are implemented correctly.

## Usage
### Installation
```bash
npm install
```

### Running Audits
To run a full audit against a sibling repository:
```bash
npm run audit -- --repo=../some-other-repo
```

## Architecture
See `.gemini/plans/2026-03-09-ergon-test-harness-architecture.md` for detailed specifications.
