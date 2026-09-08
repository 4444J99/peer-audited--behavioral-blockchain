# Styx: humanities edition

> Styx is an experiment in turning a promise into a governed record: a system
> must decide what counts as evidence, who may judge it, how disagreement is
> remembered, and when a consequence becomes legitimate.

[Back to the project overview](../../README.md) ·
[Read the plain-language edition](general.md) ·
[Audit the factual claims](../evidence/README.md)

## The analytical object

Styx is not only an accountability application. It is a formal model of a
social sequence:

**commitment → evidence → interpretation → verdict → consequence → memory**

Software makes each transition explicit. That is intellectually useful because
the system cannot hide behind the looseness of everyday language. It must encode
who is authorized to see a submission, which signals count, how many reviewers
produce consensus, how an appeal interrupts finality, and which event becomes
the durable account of what happened.

The project therefore joins questions usually separated across behavioral
economics, media studies, ethics, governance, and software architecture.

## Commitment and incentive

The design begins from a commitment-device hypothesis: a future consequence may
change present behavior, especially when a potential loss feels more salient
than an equivalent gain. The repository encodes this idea in stake mechanics,
behavioral constants, reminders, integrity scores, and completion flows.

But an encoded hypothesis is not an established outcome. Styx contains a model
and its implementation; this repository does not contain controlled evidence
that the model improves adherence, recovery, wellness, or retention. That gap is
central rather than incidental. It separates a behavioral proposition from a
behavioral finding.

## Proof is an interpretation

The Fury review layer treats “proof” as something routed through judgment. This
is a consequential design choice. A photograph, device signal, or written
attestation does not interpret itself. The system defines a field of relevance,
then asks reviewers to translate a messy event into a categorical verdict.

Consensus can distribute authority, but it does not make authority disappear.
Reviewer reputation, honeypot tests, anonymity, and bounty rules shape who is
trusted and which mistakes the system is optimized to detect. The architecture
therefore poses an epistemic question: when several bounded observations agree,
what kind of truth has actually been produced?

## The ledger as institutional memory

The double-entry ledger is more than a storage mechanism. It establishes which
changes must have a counter-entry and which version of an event the institution
will preserve. The hash-linked truth log similarly turns sequence into memory:
later records depend on earlier ones, making silent revision detectable.

This can support accountability, but durable memory also increases the cost of
misclassification. If a verdict is unfair, persistence preserves the injustice
as effectively as it preserves a correct decision. Appeal and correction paths
are therefore part of the project's theory of truth, not merely customer-support
features.

## Surveillance, privacy, and legibility

Accountability systems gain power by making conduct legible. Styx attempts to
limit that power through role boundaries, minimum necessary evidence, and an
enterprise design in which organizational readers receive aggregate engagement
rather than individual health records.

The ethical question is not resolved merely by aggregation. One must still ask:

- Was participation genuinely voluntary?
- Can a person refuse a proof request without hidden penalty?
- Does the evidence reveal more than the commitment requires?
- Can small groups be re-identified despite aggregate reporting?
- Who benefits when an employer funds the stake?
- Can a participant contest the category into which the system placed them?

The repository documents technical and policy responses to parts of these
questions. It does not establish that a real institution has deployed those
responses successfully.

## Language as a control surface

Styx includes a “linguistic cloaker” that can substitute terms such as
“commitment” and “vault” for terms associated with wagering. This is not merely
branding. Vocabulary changes how an action is socially and legally perceived.
The mechanism invites scrutiny: does a renamed practice become different, or
does language only change the reader's threshold of recognition?

The repository's own use of mythic names—Styx, Fury, Aegis, Judge—also frames
participation through judgment, oath, protection, and punishment. That aesthetic
gives the system coherence while making its theory of accountability unusually
visible.

## Authorship and institutional context

The project record identifies Anthony Padavano with product/technical policy and
implementation leadership, and Jessica Tenenbaum with business and commercial
policy. The underlying founder agreement cited by the repository remains an
unsigned draft. Automated and AI-assisted work is also visible in the revision
history. Those distinctions matter because a software repository is a composite
artifact: code, product decisions, generated contributions, frameworks, and
external services do not share one simple author.

See the [evaluator edition](evaluator.md) for the bounded contribution statement.

## Questions for study and critique

Styx can be read through at least five questions:

1. **Epistemology:** When does submitted evidence become a verified event?
2. **Governance:** Which rules are encoded, which remain discretionary, and who
   may change either kind?
3. **Political economy:** Who supplies the stake, receives a forfeiture, and
   bears the cost of error?
4. **Media form:** How do dashboards, scores, notifications, and logs transform
   an intimate commitment into an institutional object?
5. **Ethics:** Can accountability be strong without becoming coercive,
   punitive, or extractive?

The technical implementation gives those questions a concrete object. It does
not settle them.

## Suggested reading path

1. [Architecture overview](../architecture/README.md)
2. [Truth-blockchain design](../architecture/architecture--truth-blockchain-v2.md)
3. [Founder decisions of record](../planning/planning--founder-decisions-of-record.md)
4. [Implementation status](../planning/planning--implementation-status.md)
5. [Evidence and limitations](../evidence/README.md)
