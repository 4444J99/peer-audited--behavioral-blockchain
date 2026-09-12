# Architectural Split Plan: Public Face & Private Engine

## Mission
Styx contains two fundamentally different asset classes:
1. **The Public Face:** The community hub, documentation, open-source adapters, standard SDKs, and transparent rules of engagement.
2. **The Private Engine ("Secret Sauce"):** The `behavioral-physics` constants, exact prompt injections, anti-sybil honeypot coordinates, LLM evaluation pipelines, and custody routing logic.

To preserve the intellectual property and prevent adversarial gaming of the peer-audited system, this monorepo must be bifurcated before the public App Store and open-source launches.

## Target Architecture

### 1. `styx-core` (Private / Proprietary)
This repo remains strictly private and contains the critical path execution logic:
- `src/api` (NestJS router, Escrow custody, Stripe live keys)
- `src/shared/behavioral-physics` (The exact mathematical constants and motivation archetype formulas)
- `src/ask-styx` (The Cloudflare Worker proxy containing the actual LLM prompts and system instructions)
- `.github/workflows/ci-gates.yml` (The internal gates like Phantom Money Check, Linguistic Cloaker, etc.)

### 2. `styx-public` (Open Source / Public Face)
This repository is published on GitHub and represents the verifiable community surface:
- `src/web` (The Next.js dashboard UI, open for community contributions)
- `src/mobile` (The React Native shell, so users can verify device permissions and UI handling)
- `docs/` (The Logos documentation, Telos, Pragma, and API specs)
- `src/shared/types` (Interfaces and types, allowing third parties to build clients)

## Execution Sequence (Wave 4)

1. **Decouple Dependencies:** Extract `behavioral-physics` from generic UI components so the Next.js/Mobile apps do not require the proprietary mathematical constants to compile.
2. **Git History Scrubbing:** Use `git filter-repo` to create the public repository without exposing the history of private AWS/Stripe keys, internal agent conversations, or early stage vulnerable code.
3. **Submodule / NPM Linking:** Publish the generic types to a public `@styx/types` npm package (or use a submodule) so the private `styx-core` can still seamlessly consume UI updates from `styx-public`.
4. **License Attachment:** Apply a dual-license strategy. MIT or Apache 2.0 for `styx-public`, and a strict proprietary EULA for `styx-core`.

*(This plan is now officially tracked as Issue #970 and assigned to `lane/evolve-platform`)*
