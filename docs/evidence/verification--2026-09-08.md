# Styx verification receipt — 2026-09-08

**Commit:** `3ca8c3452e7fa0f5185560f6e2e547bfb4a3d649`  
**Repository:** `4444J99/peer-audited--behavioral-blockchain`  
**Scope:** historical Node 24 CI at the commit above and public Pages observation
**Public HTTP observation:** `2026-09-08T12:55:21Z`
**CI classification corrected:** `2026-09-08` after reading the actual checkout and job logs

This receipt records executed validation and live HTTP observations. It is not deployment or production-operation evidence.

## Historical run: executed work and skipped integration modes

GitHub Actions [run 34228809266](https://github.com/4444J99/peer-audited--behavioral-blockchain/actions/runs/34228809266) was associated with PR head `3ca8c3452e7fa0f5185560f6e2e547bfb4a3d649`. Its actual checkout was the synthetic merge commit `85cad11f7f27483c285964a2ab63b4ae8f8ed144`, merging that head into base `42c853ff514f26533d5308d21b117da85c7a1da2`. The HTTP observation timestamp above predates completion of CI and must not be used as a completed-run timestamp.

The following work executed successfully:

- dependency installation
- the selected API tests: 170 suites / 2,108 tests passed; the three selected Turbo tasks had zero cache hits
- coverage artifact upload
- Turborepo build
- lint
- redacted-build gate
- security-invariant gate
- claim-drift gate
- aggregate build-and-test verdict
- Terraform format, initialization, and validation

The build had 1 cached task out of 11, and lint had 1 cached task out of 12. Cache-replayed output is retained validation evidence, not a new execution of that task.

Two successful step wrappers did **not** execute their integration predicates: Gate 05 logged `Skipping Gate 05 (NOT VERIFIED)` because `CI_GATE05_API_URL` was absent, and Gate 08 logged `Skipping Gate 08 (NOT VERIFIED)` because `CI_GATE08_DATABASE_URL` was absent. The `e2e_browsers` job was skipped with zero steps. The successful aggregate E2E verdict therefore does not establish a browser run for this historical head.

Secret Scan run `34228809357`, CodeQL run `34228809345`, and Release Drafter run `34228809330` also completed successfully at the same head.

The formerly failing zero-escrow behavioral test was corrected to match the existing custody rule: a zero-dollar contract does not request an external escrow hold. This is validation evidence for the repository implementation, not proof of a deployed payment or escrow service.

## Later validation observed during activation continuation

[Run 34234244538](https://github.com/4444J99/peer-audited--behavioral-blockchain/actions/runs/34234244538) is associated with later PR head `f51f68765b66970555f8250a95eaf72d17be15b9`. The checkout logs bind execution to synthetic merge `34818b445960087f369589f3dd415a9fdec1738f`, whose parents are that head and the same base above. These results belong to that merge, not to a future receipt-only descendant.

- Node 24 dependencies installed. All 12 selected Turbo test tasks and all 11 build tasks were cache hits; lint had 11 cache hits out of 12. Their replayed test counts are not a fresh complete-suite execution.
- [Chromium job 102088466212](https://github.com/4444J99/peer-audited--behavioral-blockchain/actions/runs/34234244538/job/102088466212) and [Firefox job 102088466067](https://github.com/4444J99/peer-audited--behavioral-blockchain/actions/runs/34234244538/job/102088466067) each executed 74 passing tests and one explicit skip. The API-health check is conditional on an API target and is not established by the browser summaries.
- Gate 05 and Gate 08 again logged the same missing-target `NOT VERIFIED` warnings. Aggregate `build_and_test` and `e2e` jobs are verdict wrappers, not additional test suites.
- The dependency audit was advisory (`continue-on-error`) and reported 30 vulnerabilities: 21 moderate and 9 high. A green job is not a clean dependency-audit result.
- Fresh local execution on the exact checked-out PR source `f51f68765b66970555f8250a95eaf72d17be15b9` passed 55 tests in the zero-escrow behavioral and device-attestation suites after `npm ci --ignore-scripts --no-audit --no-fund`. These use synthetic/mocked boundaries; they do not exercise a live provider or deployed full lifecycle.

The authenticated full-loop runtime gate still requires an authorized API target, synthetic demo identities and its injected demo password, database/queue services, and the resulting ledger/truth-log receipt. Source, mock-based tests, and the web E2E suite do not substitute for that gate.

## Public Pages observation

A live HTTP request returned `200` for:

`https://4444j99.github.io/peer-audited--behavioral-blockchain/`

The returned Ask Styx HTML referenced:

- `/ask-styx/assets/index-D1Ny8FSA.js`
- `/ask-styx/assets/index-DlLXixHf.css`

Both referenced host-level assets returned `404`. The corresponding repository-root asset request also returned `404`. At that observation, the public endpoint was an HTML shell with missing required assets, not a usable deployed application.

## Post-merge public asset observation

PR #958 was independently merged at `2026-09-08T15:00:32Z` as `08fed1f600a239c886491f502061bbb5613bf3a5`. Its tree `bc8797504e10e3276798d35e0cfbdb4d4d229b51` is byte-identical to the tested `f51f6876` tree. [Pages run 34241967637](https://github.com/4444J99/peer-audited--behavioral-blockchain/actions/runs/34241967637) then executed build and deployment successfully.

A later HTTP observation at `2026-09-08T15:06:37Z` supersedes the earlier missing-JavaScript/CSS finding: the root returned 200 and referenced `/peer-audited--behavioral-blockchain/assets/index-BmOW1VNr.js` and `/peer-audited--behavioral-blockchain/assets/index-DlLXixHf.css`, both of which returned 200. The optional `/ask-styx/favicon.svg` still returned 404 and no favicon file exists in the Ask Styx source. This establishes served bundle bytes, not browser interaction or a working chat provider, API, authenticated lifecycle, or payment service.

## Evidence classification

- Source at the commit: implementation evidence.
- Successful Node 24 CI: validation evidence.
- Earlier broken Pages shell: historical failed deployment evidence, superseded for required JavaScript/CSS paths by the later public asset observation.
- Later Pages build/deployment and public asset responses: bounded static deployment evidence; browser and service acceptance remain separate.
- No live payment, escrow, or production workflow was exercised; operational evidence remains absent.
