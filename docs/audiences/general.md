# Styx, in plain language

> Styx is a software prototype for making a personal commitment, submitting
> evidence that it was completed, and asking other people to review that
> evidence before a consequence is applied.

[Back to the project overview](../../README.md) ·
[See what is verified](../evidence/README.md) ·
[Read the technical edition](technical.md)

## What is this?

Styx explores a familiar problem: saying “I will do this” is easy, but ordinary
accountability tools often do not connect the promise, the proof, and the
consequence. A calendar can record an intention. A friend can encourage you. A
payment app can move money. Styx experiments with joining those functions in one
auditable process.

The repository is the working record of that experiment. It contains server and
interface code, tests, design documents, safety rules, deployment automation,
and records of decisions. It is useful evidence of a substantial implementation,
but it is not evidence that a public product has been adopted or that the method
improves behavior.

## What problem led to it?

Many commitments fail in the space between intention and verification:

1. a person states a goal;
2. no shared rule defines what counts as completion;
3. evidence, if any, is interpreted informally;
4. the consequence is easy to waive or impossible to audit;
5. nobody can reconstruct why a decision was made.

Styx treats that gap as a systems problem. It makes the commitment explicit,
records evidence and review, and keeps a ledger of the resulting decision.

## What happens when someone uses it?

In the intended workflow:

1. **The participant defines a commitment.** The goal, deadline, proof rule,
   and consequence are made explicit.
2. **The system records a stake.** In the current safe demonstration this is
   synthetic test money. The codebase also contains payment-provider adapters,
   but this documentation does not claim a verified production settlement.
3. **The participant submits proof.** That may be a record, image, attestation,
   or supported device signal, depending on the configured commitment.
4. **Reviewers judge the proof.** The “Fury” subsystem routes submissions to
   peer reviewers and combines their verdicts.
5. **The result becomes part of the record.** The ledger and audit log preserve
   what happened and which rule produced the outcome.

## A concrete example

Imagine an adult choosing a five-day no-contact commitment after a breakup. The
participant defines the check-in rule and uses a synthetic credit in the demo.
Each day, they submit the required attestation. A reviewer sees only the material
needed for the decision, records a verdict, and the system updates the commitment
and test-money ledger.

That example illustrates a designed workflow. It does **not** show that Styx is
a clinical service, that a real-money cohort has run, or that the approach has a
measured effect on recovery.

## Why might it matter?

The project makes normally invisible decisions inspectable:

- What exactly did the person promise?
- What counted as evidence?
- Who was allowed to judge it?
- How was disagreement resolved?
- What information did an employer or coach see?
- What happened to a stake after the verdict?

Those questions matter beyond software. They concern trust, privacy, fairness,
motivation, and the power to define whether a human action “counts.” The
[humanities edition](humanities.md) examines those tensions directly.

## What currently exists?

The repository contains implemented API, web, mobile, and desktop workspaces;
double-entry ledger and peer-review logic; compliance controls; a synthetic
test-money demonstration; automated tests; and deployment workflows.

Its canonical status is **prototype**. On 2026-08-31, a public GitHub Pages root
responded, but the assets and routes needed to use it returned `404`. No public
API or complete web deployment was independently verified. The exact check and
the limits on every public claim are in the [evidence record](../evidence/README.md).

## Where should I go next?

- To inspect mechanisms and run the project, read the
  [technical edition](technical.md).
- To examine trust, surveillance, judgment, and incentive design, read the
  [humanities edition](humanities.md).
- To assess a possible organizational workflow, read the
  [business edition](business.md).
- To evaluate Anthony Padavano's contribution, read the
  [evaluator edition](evaluator.md).
- To distinguish source evidence from proposals, use the
  [evidence record](../evidence/README.md).
