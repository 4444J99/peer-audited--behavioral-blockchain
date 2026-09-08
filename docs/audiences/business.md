# Styx: business and operational edition

> Styx is a prototype workflow for defining a commitment, collecting evidence,
> routing review, and recording a consequence. Organizational and
> corporate-wellness uses are proposed applications, not represented here as
> customer deployments.

[Back to the project overview](../../README.md) ·
[Inspect the technical edition](technical.md) ·
[Audit the claims](../evidence/README.md)

## The operational problem

Accountability programs often coordinate several disconnected processes:

- a participant agrees to a goal in one system;
- reminders arrive through another;
- proof is sent through email, chat, or a form;
- a coach or administrator judges it manually;
- refunds, fees, or rewards are calculated elsewhere;
- the organization cannot reconstruct the complete decision path.

The result is operational ambiguity. Participants do not know exactly what
counts. Reviewers lack a consistent queue. Finance cannot easily reconcile a
decision with a transaction. Privacy teams may receive more sensitive data than
the program actually needs.

## How Styx changes the workflow

The implemented prototype joins those steps around one contract and audit trail:

1. define the commitment, duration, evidence rule, and stake policy;
2. check identity, age, and jurisdiction rules before protected actions;
3. collect an attestation or proof submission;
4. route the submission to scoped reviewers;
5. aggregate verdicts and permit an appeal path;
6. update the contract and double-entry ledger;
7. expose role-appropriate status to the participant, reviewer, operator, or
   enterprise reader.

The synthetic demo uses test money. Payment-provider integration paths exist in
source, but a production settlement environment was not independently verified
for this documentation update.

## Inputs and outputs

| Inputs                                     | Outputs                                                 |
| ------------------------------------------ | ------------------------------------------------------- |
| Participant and role identity              | Authenticated, role-scoped session                      |
| Commitment terms and deadline              | Versioned contract state                                |
| Evidence or attestation                    | Review task and provenance record                       |
| Reviewer verdicts                          | Consensus result, dispute eligibility, reviewer history |
| Jurisdiction and policy configuration      | Allow, restrict, refund-only, or block decision         |
| Synthetic credit or payment-provider event | Balanced ledger entries and reconciliation state        |
| Organizational scope                       | Aggregate or scoped reporting surface                   |

## Possible operating contexts

| Context                              | Status                               | Evidence boundary                                                                                                               |
| ------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| No-contact / breakup-recovery cohort | **Current product wedge; prototype** | Source, product decisions, synthetic demo, and test coverage exist. No outcome or adoption result is claimed.                   |
| Health or fitness accountability     | **Proposed extension**               | Device and health-oriented components exist; no verified industry deployment is claimed.                                        |
| Corporate wellness                   | **Proposed terminal market**         | B2B APIs, scopes, billing, and aggregate-reporting designs exist; no customer deployment or commercial result is claimed.       |
| Coaching or practitioner workflow    | **Proposed pilot path**              | Operational and sales materials describe a test-money offer contingent on launch gates; no completed external pilot is claimed. |

## Integration requirements

A serious evaluation would need to resolve:

- PostgreSQL and Redis hosting, migrations, backup, and recovery;
- identity, KYC, payment, object-storage, AI, and notification providers;
- participant consent and evidence-retention policy;
- jurisdiction policy and counsel review for any money-linked behavior;
- SSO, roles, enterprise scopes, and minimum-size aggregation thresholds;
- incident response, support ownership, appeals, and manual exception handling;
- analytics definitions agreed before any outcome or ROI claim.

The repository contains blueprints and procedures for several of these items.
Configuration is not equivalent to an operated service.

## Risks and constraints

| Risk                            | Current project response                                             | Remaining evidence needed                                          |
| ------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Coercion or inappropriate goals | Goal screening, safety documentation, consent-oriented product scope | Human review protocol and real-world governance evaluation         |
| Financial/regulatory exposure   | Jurisdiction tiers, KYC/age gates, test-money beta boundary          | Counsel approval and provider acceptance for each intended market  |
| Sensitive data exposure         | Role scopes and aggregate enterprise design                          | Privacy impact assessment and deployed access-control verification |
| Incorrect peer verdict          | Consensus, reviewer scoring, honeypots, appeal paths                 | Bias/error measurements under real operating conditions            |
| Ledger/payment divergence       | Double-entry records and reconciliation paths                        | Provider-backed end-to-end settlement receipts                     |
| Reliability                     | CI, smoke checks, observability, deployment automation               | Stable target, service-level history, load and incident evidence   |

## Deployment status

The canonical status is **prototype**. A local synthetic demonstration and
deployment workflows exist. On 2026-08-31, the public Pages root returned a
broken application shell and no public API/full web target was independently
verified. See the [deployment observation](../evidence/README.md#deployment-observation).

## Evidence versus projected value

| Statement                                                                                  | Classification                                                                         |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| The repository implements contract, review, ledger, compliance, and multi-client surfaces. | Verified by source and repository tests, subject to the current reproducibility notes. |
| A role-scoped enterprise direction is represented in code and design.                      | Verified as an implemented/prototyped direction.                                       |
| Styx reduces program cost, improves completion, or increases retention.                    | **Not established.** These require agreed metrics and operating data.                  |
| Styx has been deployed by an employer, insurer, clinic, or paid customer.                  | **Not established.** No such claim is made.                                            |
| The system is ready for real-money or regulated production use.                            | **Not established.** Provider, legal, security, reliability, and release gates remain. |

## A bounded next evaluation

The defensible next step is not an enterprise rollout. It is a consented,
test-money evaluation with synthetic or tightly minimized data, explicit stop
conditions, a named human appeal owner, and metrics defined in advance. Only a
green launch-gate receipt should move the work from source inspection to an
external pilot conversation.
