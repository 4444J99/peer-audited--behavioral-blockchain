# Styx verification receipt — 2026-08-31

**Commit:** `42c853ff514f26533d5308d21b117da85c7a1da2`  
**Repository:** `4444J99/peer-audited--behavioral-blockchain`  
**Scope:** dependency reproducibility, workspace tests, public Pages observation,
and documentation claim drift  
**Tracked source changes during diagnostic run:** none

This receipt records what was observed. It is not a release approval.

## Runtime

```text
node --version                 v24.19.0
global npm --version          11.9.0
repository-declared npm used  10.8.2 (through Corepack)
```

## Install/reproducibility check

```bash
corepack npm@10.8.2 ci
```

**Result:** failed before test execution. The root manifest and lockfile are out
of sync; npm reported that `@nestjs/platform-express@11.2.3` was missing from
the lockfile.

```bash
corepack npm@10.8.2 install --package-lock=false
```

**Result:** failed dependency resolution. The resolved TypeScript 7.0.2 package
conflicts with `ts-jest`'s declared TypeScript peer range below 7.

For diagnostic measurement only, dependencies were installed without changing
the tracked lockfile by using npm's legacy-peer mode. The runner temporarily
used a TypeScript 6 alias inside ignored `node_modules`, passed
`ignoreDeprecations: 6.0` through inline Jest configuration, and built the shared
workspace with:

```bash
../../node_modules/.bin/tsc --ignoreDeprecations 6.0
```

TypeScript 7.0.2 was restored afterward. No manifest, lock, source, test, or
configuration file was changed by this workaround. Because the clean install
gate failed, these results are diagnostic rather than a reproducible CI receipt.

## Workspace test results

Jest and Vitest JSON reporters were used to count assertions from executed
workspaces rather than estimating from source text.

| Workspace       | Test files |   Defined |    Passed | Failed |
| --------------- | ---------: | --------: | --------: | -----: |
| API             |        170 |     2,108 |     2,104 |      4 |
| Web             |         55 |       481 |       481 |      0 |
| Mobile          |         33 |       324 |       324 |      0 |
| Desktop         |         12 |       148 |       148 |      0 |
| Shared          |         10 |       215 |       215 |      0 |
| Ask Styx        |          4 |        46 |        46 |      0 |
| Test harness    |          1 |         4 |         4 |      0 |
| Audience engine |          2 |        21 |        21 |      0 |
| Audit engine    |          2 |        31 |        31 |      0 |
| Styx CLI        |          1 |         4 |         4 |      0 |
| **Total**       |    **290** | **3,382** | **3,378** |  **4** |

### Four API failures

1. `contracts.service.behavioral.spec.ts` expects `holdStake(..., 0, ...)`, while
   the current service skips escrow holds when the stake is zero. This is a
   source/test expectation contradiction, not a passed invariant.
2. Two cases in `corepay-payout.provider.spec.ts` timed out while targeting
   `https://nonexistent.corepay.test` in the network-restricted verification
   environment.
3. One case in `web-shop.controller.spec.ts` timed out against the same synthetic
   unreachable Corepay host.

The three network-dependent failures may be environment-sensitive. They remain
failures in this receipt; they are not relabeled as passes.

## Test-count drift conclusion

The former README's four printed workspace counts were:

```text
640 + 273 + 166 + 128 = 1,207
```

The prose called that total `1,107`. Correcting only the arithmetic to `1,207`
would still publish stale data: the current API workspace alone defines 2,108
tests, and the current 10-workspace total is 3,382. The README now reports this
commit-bound execution result and does not claim that all tests pass.

## Public Pages observation

The following requests were made with `curl -L` from an external HTTP client:

```text
404 https://a-organvm.github.io/peer-audited--behavioral-blockchain/
200 https://4444j99.github.io/peer-audited--behavioral-blockchain/
404 https://4444j99.github.io/peer-audited--behavioral-blockchain/launch
404 https://4444j99.github.io/peer-audited--behavioral-blockchain/ask-styx
```

The current root returned this identifying metadata:

```html
<title>Ask Styx</title>
<script
  type="module"
  crossorigin
  src="/ask-styx/assets/index-D1Ny8FSA.js"
></script>
<link rel="stylesheet" crossorigin href="/ask-styx/assets/index-DlLXixHf.css" />
```

Both referenced assets returned `404` at the host paths implied by the HTML.
Accordingly, the root `200` is evidence of an HTML shell only, not a usable demo.
No public API or complete web target was independently verified in this check.

## Repository authorship observation

`git shortlog -sne HEAD` at the verified commit reported:

```text
178  4444jPPP <etceter4@etceter4.com>
118  Anthony James Padavano <padavano.anthony@gmail.com>
 73  Anthony James Padavano <etceter4@etceter4.com>
 43  dependabot[bot]
 18  Test User
 12  github-actions[bot]
 10  Claude
  3  4444jPPP <padavano.anthony@gmail.com>
```

Path-scoped shortlogs place explicit Anthony and `4444jPPP` identities across
`src/api`, `src/web`, `src/mobile`, `src/desktop`, `scripts`, and `docs`.
Together with the founder role ledger, this supports a substantial technical and
product contribution claim. It does not prove that every commit is independent
human authorship, that the `4444jPPP` identity should be legally merged with a
named person, or that repository activity settles IP ownership.

## Documentation corrections supported by this receipt

- Project implementation status: `PROTOTYPE`
- Deployment status: `not-deployed`
- Current public demo claim: not established
- Current test definition: 3,382 across 290 files
- Current diagnostic result: 3,378 passed, 4 failed
- Historical `1,107` statement: false arithmetic and stale
- Historical `1,207` subtotal: arithmetically correct for the old four rows, but
  stale and not a current suite total
- Beta-readiness policy path:
  `docs/planning/planning--beta-readiness-contract.md`
