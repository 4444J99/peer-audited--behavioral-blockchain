# Styx evidence and limitations record

> This page is the readable index for Styx's claim-level evidence. It separates
> implemented source, dated observations, historical records, and proposed uses.

[Back to the project overview](../../README.md) ·
[General edition](../audiences/general.md) ·
[Technical edition](../audiences/technical.md) ·
[Evaluator edition](../audiences/evaluator.md)

## How to read this record

- **Verified** means the cited artifact or fresh check directly supports the
  bounded statement.
- **Partial** means an implementation or configuration exists but an external,
  operational, or end-to-end condition was not verified.
- **Historical** means the source records a past observation and should not be
  treated as current without a new check.
- **Proposed** means the repository contains a design or intended application,
  not evidence of deployment or outcome.
- **Not established** means this documentation makes no affirmative claim.

Machine-readable assertion records live in [`assertions/`](assertions/), and
the canonical factual substrate is [`project-record.yml`](../../project-record.yml).

## Claim register

| Claim                                                                           | Status                               | Evidence                                                                                                                                             | Limitation                                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Styx is a multi-interface behavioral-commitment prototype.                      | Verified                             | Workspace manifests, source tree, [architecture](../architecture/README.md), [implementation matrix](../planning/planning--implementation-status.md) | “Prototype” does not imply public availability, operational reliability, or user adoption. |
| Ledger, peer-review, compliance, and synthetic-demo mechanisms exist in source. | Verified at source/test level        | API modules and migrations, validation scripts, [implementation matrix](../planning/planning--implementation-status.md)                              | Provider-backed production behavior and enterprise scale were not independently verified.  |
| The public Pages surface is a usable demo.                                      | Disputed by fresh check              | [Deployment observation](#deployment-observation)                                                                                                    | Root HTML returned `200`, but required assets and documented routes returned `404`.        |
| A public API/full web product is deployed.                                      | Not established                      | No independently verified target was available during this update.                                                                                   | Workflows and blueprints show deployment capability, not current service health.           |
| Anthony Padavano leads product/technical policy and implementation.             | Verified as a repository role record | [Founder decisions](../planning/planning--founder-decisions-of-record.md), repository history                                                        | The cited founder agreement is unsigned; the role statement is not a sole-ownership claim. |
| Jessica Tenenbaum leads business/commercial policy.                             | Verified as a repository role record | [Founder decisions](../planning/planning--founder-decisions-of-record.md)                                                                            | The same unsigned-agreement boundary applies.                                              |
| Corporate wellness is an implemented customer deployment.                       | Proposed, not deployed               | B2B source, enterprise docs, founder market sequence                                                                                                 | No customer, pilot, adoption, or result is represented as verified.                        |
| Styx improves completion, recovery, wellness, retention, or ROI.                | Not established                      | No outcome dataset or controlled evaluation is cited.                                                                                                | These statements require operational data and an agreed evaluation design.                 |

## Test verification

The former root README claimed **1,107 tests**, while the four counts printed
directly below it—640 API, 273 mobile, 166 web, and 128 desktop—sum to
**1,207**. That was an arithmetic contradiction, not a valid test receipt.

This pilot uses fresh execution where possible and labels installation or
environment blockers. The exact command results are preserved in
[`verification--2026-08-31.md`](verification--2026-08-31.md). A copied test
total should never substitute for the workspace output on the commit being
evaluated.

## Deployment observation

Checked from a clean external HTTP client on **2026-08-31**:

| Request                                                                | Result     | Interpretation                                                                              |
| ---------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| `https://a-organvm.github.io/peer-audited--behavioral-blockchain/`     | `404`      | The older activation ledger's `200` observation is stale.                                   |
| `https://4444j99.github.io/peer-audited--behavioral-blockchain/`       | `200`      | An HTML shell responds, but this alone does not prove the application works.                |
| HTML title at the current root                                         | `Ask Styx` | The served artifact differs from the checked-in pitch artifact described by the old README. |
| `/launch` under the current root                                       | `404`      | The documented launch surface is unavailable.                                               |
| `/ask-styx` under the current root                                     | `404`      | The documented Q&A route is unavailable.                                                    |
| `/ask-styx/assets/index-D1Ny8FSA.js` and `.css` referenced by the HTML | `404`      | The shell cannot load the JavaScript and stylesheet required to operate.                    |

This is why the project record uses `PROTOTYPE` and `not-deployed` rather than
inferring a working deployment from a `200` root response.

## Authorship and provenance boundary

The repository's living founder ledger records Jessica Tenenbaum as the
business/commercial decision lead and Anthony Padavano as the product/technical
decision and implementation lead. It explicitly labels the associated founder
agreement draft **unsigned**. Git history is dominated by Anthony-associated
identities across product workspaces, while also containing collaborative,
automated, bot, test, and Claude-identified contributions.

Accordingly, the public claim is bounded to **role and inspectable contribution**.
This record does not claim sole authorship, settled IP ownership, or that commit
count alone proves creative responsibility.

## Known limitations

1. No verified public API or complete web deployment was available on
   2026-08-31.
2. The Pages shell was incomplete; its root `200` must not be cited as a usable
   demo or launch.
3. The lockfile and workspace manifests were out of sync during fresh-checkout
   verification, so `npm ci` did not provide a reproducible install receipt.
4. Tests can verify implemented behavior under their fixtures; they do not prove
   regulatory suitability, security under hostile operation, or production
   reliability.
5. No verified customer deployment, public adoption, revenue, behavioral
   outcome, retention improvement, or ROI evidence is claimed.
6. Corporate wellness, insurance, health/fitness, and practitioner uses remain
   proposed unless a future assertion record cites a deployment or pilot receipt.
7. The founder agreement referenced by the role ledger is unsigned; legal
   ownership should not be inferred from this repository.

## Freshness rule

Current-state statements include a verification date. Deployment observations
should be rechecked before publication or after 24 hours, whichever comes first.
Source/test claims should be regenerated on the exact commit after dependency,
test, or release changes. Historical ledgers remain evidence of what was observed
then, not proof of what is true now.

## Evidence hierarchy used here

1. Fresh verifier output tied to a date and commit
2. Executable source and tests on that commit
3. Ratified or explicit repository decision records
4. Dated implementation and activation records
5. Plans, research, projections, and positioning documents

The lower levels can explain intent. They cannot override a failed live check or
promote a proposal into a deployment claim.
