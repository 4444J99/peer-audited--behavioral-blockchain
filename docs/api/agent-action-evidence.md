# Agent Action Evidence Contract

Styx implements `organvm.execution/v1` as an append-only evidence boundary for
consequential agent work. It answers who acted, under whose authority, which
policy was applied, what an external executor changed, and how the result was
verified or challenged.

This API **records facts; it does not execute an action**. In particular,
recording `APPROVED` never sends a message, changes a booking, moves money, or
invokes a provider. The executor remains a separately authorized component.

## Event sequence

Every execution starts with exactly one `PROPOSED` event. Later facts are
appended as distinct events:

1. `PROPOSED` — acting principal, delegated authority, policy decision, source
   evidence, tool receipts, and the proposed mutation.
2. `APPROVAL_RECORDED` — authenticated operator approval or rejection when the
   policy requires a human gate.
3. `MUTATION_RECORDED` — receipt for work an external executor performed.
4. `VERIFICATION_RECORDED` — explicit postcondition checks and their evidence.
5. `ROLLBACK_RECORDED` — rollback receipt and outcome, when needed.
6. `DISPUTE_OPENED` and `PEER_REVIEW_RECORDED` — review of a contested record.

The service rejects a mutation receipt when policy denied the action, when a
required approval is absent, when a human rejected it, or when delegated
authority expired. It also refuses to append onto a chain that fails integrity
verification. Database triggers reject `UPDATE` and `DELETE`. Each execution has
its own hash chain, and each event hash is anchored into Styx's global truth log
in the same database transaction.

## Proposal example

```json
{
  "producer": "styx-api",
  "actingPrincipal": {
    "id": "agent:case-summarizer",
    "type": "AGENT",
    "organization": "styx"
  },
  "delegatedAuthority": {
    "grantor": {
      "id": "human:operator-42",
      "type": "HUMAN",
      "organization": "styx"
    },
    "scopes": ["contracts:annotate"],
    "constraints": ["no-payment", "human-approval-before-mutation"],
    "grantReference": "policy:agent-actions/v1",
    "expiresAt": "2026-09-01T17:00:00.000Z"
  },
  "policyDecision": {
    "outcome": "REQUIRE_APPROVAL",
    "policyId": "agent-actions",
    "policyVersion": "1.0.0",
    "reasons": ["The change is customer-visible"],
    "evaluatedAt": "2026-08-31T13:00:00.000Z"
  },
  "evidence": [
    {
      "kind": "source-record",
      "uri": "styx://contracts/contract-42",
      "digest": "sha256:..."
    }
  ],
  "toolCalls": [
    {
      "tool": "contracts.read",
      "invocationId": "call-42",
      "outcome": "SUCCEEDED",
      "responseDigest": "sha256:..."
    }
  ],
  "proposedMutation": {
    "kind": "contract-annotation",
    "target": "styx://contracts/contract-42",
    "operation": "append-review-note",
    "summary": "Append a review note; do not change financial state",
    "idempotencyKey": "execution-42"
  },
  "requiresHumanApproval": true
}
```

Send this body to `POST /agent-actions/execution-42/proposal`. The authenticated
admin principal is stored as `recordedBy`; clients cannot claim a different
approver or reviewer in request JSON.

## Security boundary

- All routes require authenticated `ADMIN` access.
- The global truth log receives only record identifiers and digests, not source
  content.
- Raw credentials, bearer/basic authorization values, cookies, private keys,
  common secret-bearing fields, and signed URLs are rejected.
- Evidence should use stable URIs and digests. Store sensitive source material
  in its system of record and authorize retrieval there.
- `executionId` and mutation idempotency keys should be stable across retries.

## Product adapters

The stored event contract is provider-neutral. Product adapters translate local
events into the fields above and keep mutation execution outside Styx.

| Product                          | Proposal trigger                               | Acting principal        | Authority scope                              | Proposed mutation                          | Human gate                                           | Verification                                           |
| -------------------------------- | ---------------------------------------------- | ----------------------- | -------------------------------------------- | ------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------ |
| Public-Record Data Scraper / UCC | collector exception or jurisdiction activation | collector service/agent | read named sources; propose collector config | activate or amend a jurisdiction collector | reviewer approves source/config change               | fixture pass, source digest, normalized-record sample  |
| Hospes                           | draft guest message or booking-state proposal  | concierge service/agent | draft for named property/reservation only    | send message or change booking state       | operator approves before the Hospes executor commits | provider receipt plus re-read of message/booking state |

For Hospes, `APPROVAL_RECORDED` is evidence of permission, not a command. Its
message or booking executor must independently verify the approval event, scope,
expiry, and idempotency key before committing, then append the mutation receipt.

## Endpoints

| Method | Path                                       | Meaning                                                   |
| ------ | ------------------------------------------ | --------------------------------------------------------- |
| `POST` | `/agent-actions/:executionId/proposal`     | Start an immutable execution record.                      |
| `POST` | `/agent-actions/:executionId/approval`     | Record authenticated approval/rejection; execute nothing. |
| `POST` | `/agent-actions/:executionId/mutation`     | Record an external executor receipt.                      |
| `POST` | `/agent-actions/:executionId/verification` | Record postcondition checks.                              |
| `POST` | `/agent-actions/:executionId/rollback`     | Record external rollback evidence.                        |
| `POST` | `/agent-actions/:executionId/disputes`     | Open one dispute.                                         |
| `POST` | `/agent-actions/:executionId/peer-review`  | Record the finding for an open dispute.                   |
| `GET`  | `/agent-actions/:executionId`              | Read state, events, and hash-chain integrity.             |

The first slice intentionally permits one approval, mutation, verification,
rollback, dispute, and peer-review finding per execution. A retry that represents
a new consequential attempt should use a new execution ID and reference the
earlier record in its evidence.

An identical retry after the first event committed returns `409 Conflict`; the
service does not silently treat it as success. Clients must `GET
/agent-actions/:executionId`, compare the stored event/receipt with the intended
write, and reconcile. Retry the same network operation only while the commit
outcome is unknown; use a new execution ID for a genuinely new attempt.
