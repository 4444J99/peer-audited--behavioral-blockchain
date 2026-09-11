import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { Pool, PoolClient } from "pg";
import { TruthLogService } from "../../../services/ledger/truth-log.service";
import { AgentActionEvidenceService } from "./agent-action-evidence.service";
import type { ProposeAgentActionDto } from "./dto";

function proposal(
  overrides: Partial<ProposeAgentActionDto> = {},
): ProposeAgentActionDto {
  return {
    producer: "styx-api",
    actingPrincipal: {
      id: "agent:collector-1",
      type: "AGENT",
      organization: "styx",
    },
    delegatedAuthority: {
      grantor: { id: "human:owner-1", type: "HUMAN", organization: "styx" },
      scopes: ["contracts:annotate"],
      constraints: ["no-payment", "human-approval-before-mutation"],
      grantReference: "policy:agent-actions/v1",
      expiresAt: "2099-01-01T00:00:00.000Z",
    },
    policyDecision: {
      outcome: "REQUIRE_APPROVAL",
      policyId: "agent-actions",
      policyVersion: "1.0.0",
      reasons: ["The action changes a customer-visible record"],
      evaluatedAt: "2026-08-31T12:00:00.000Z",
    },
    evidence: [
      {
        kind: "source-record",
        uri: "styx://contracts/contract-1",
        digest: "sha256:source",
      },
    ],
    toolCalls: [
      {
        tool: "contracts.read",
        invocationId: "call-1",
        outcome: "SUCCEEDED",
        responseDigest: "sha256:response",
      },
    ],
    proposedMutation: {
      kind: "contract-annotation",
      target: "styx://contracts/contract-1",
      operation: "append-review-note",
      summary: "Append a review note; no financial state changes",
      idempotencyKey: "execution-1",
    },
    requiresHumanApproval: true,
    ...overrides,
  };
}

describe("AgentActionEvidenceService", () => {
  let rows: any[];
  let client: { query: jest.Mock; release: jest.Mock };
  let pool: { connect: jest.Mock; query: jest.Mock };
  let truthLog: { appendEvent: jest.Mock };
  let service: AgentActionEvidenceService;

  beforeEach(() => {
    rows = [];
    client = {
      query: jest.fn(async (sql: string, params?: unknown[]) => {
        if (sql.includes("FROM agent_action_evidence_events")) {
          const executionId = String(params?.[0]);
          return {
            rows: rows
              .filter((row) => row.execution_id === executionId)
              .sort(
                (left, right) =>
                  Number(left.sequence_index) - Number(right.sequence_index),
              ),
          };
        }
        if (sql.includes("INSERT INTO agent_action_evidence_events")) {
          const values = params as unknown[];
          const row = {
            id: values[0],
            schema_version: values[1],
            execution_id: values[2],
            sequence_index: values[3],
            event_type: values[4],
            producer: values[5],
            recorded_by: values[6],
            payload: values[7],
            previous_event_hash: values[8],
            event_hash: values[9],
            truth_log_event_id: values[10],
            created_at: values[11],
          };
          rows.push(row);
          return { rows: [row] };
        }
        return { rows: [] };
      }),
      release: jest.fn(),
    };
    pool = {
      connect: jest.fn().mockResolvedValue(client),
      query: jest.fn(async (sql: string, params?: unknown[]) => {
        if (sql.includes("FROM agent_action_evidence_events")) {
          return {
            rows: rows.filter(
              (row) => row.execution_id === String(params?.[0]),
            ),
          };
        }
        return { rows: [] };
      }),
    };
    truthLog = {
      appendEvent: jest
        .fn()
        .mockImplementation(async () => "00000000-0000-4000-8000-000000000001"),
    };
    service = new AgentActionEvidenceService(
      pool as unknown as Pool,
      truthLog as unknown as TruthLogService,
    );
  });

  it("records the complete approval, mutation, verification, dispute, and peer-review path", async () => {
    await service.propose("execution-1", proposal(), "admin:alice");
    await service.recordApproval(
      "execution-1",
      {
        decision: "APPROVED",
        reason: "Change is bounded and reversible",
        evidence: [],
      },
      "admin:bob",
    );
    await service.recordMutation(
      "execution-1",
      {
        outcome: "SUCCEEDED",
        receipt: "receipt:mutation-1",
        beforeDigest: "sha256:before",
        afterDigest: "sha256:after",
        evidence: [],
      },
      "service:executor",
    );
    await service.recordVerification(
      "execution-1",
      {
        outcome: "PASSED",
        checks: ["annotation-visible", "ledger-unchanged"],
        evidence: [],
      },
      "service:verifier",
    );
    await service.openDispute(
      "execution-1",
      {
        reason: "Verify the source note was interpreted correctly",
        evidence: [],
      },
      "admin:carol",
    );
    await service.recordPeerReview(
      "execution-1",
      {
        finding: "AFFIRMED",
        rationale: "Source and receipt agree",
        evidence: [],
      },
      "admin:dave",
    );

    const execution = await service.getExecution("execution-1");
    expect(execution.integrity).toEqual({
      valid: true,
      checked: 6,
      corruptedEventIds: [],
    });
    expect(execution.state).toMatchObject({
      status: "REVIEWED",
      approvalDecision: "APPROVED",
      mutationOutcome: "SUCCEEDED",
      verificationOutcome: "PASSED",
      disputed: true,
      peerReviewFinding: "AFFIRMED",
    });
    expect(
      execution.events.find((event) => event.eventType === "APPROVAL_RECORDED")
        ?.payload,
    ).toMatchObject({ decidedBy: "admin:bob" });
    expect(truthLog.appendEvent).toHaveBeenCalledTimes(6);
    expect(client.release).toHaveBeenCalledTimes(6);
  });

  it("fails closed when a mutation is recorded before required approval", async () => {
    await service.propose("execution-2", proposal(), "admin:alice");

    await expect(
      service.recordMutation(
        "execution-2",
        { outcome: "SUCCEEDED", receipt: "receipt:2", evidence: [] },
        "service:executor",
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(rows).toHaveLength(1);
  });

  it("returns a conflict for an identical post-commit retry so callers reconcile by GET", async () => {
    const dto = proposal();
    await service.propose("execution-retry", dto, "admin:alice");

    await expect(
      service.propose("execution-retry", dto, "admin:alice"),
    ).rejects.toThrow(ConflictException);
    expect(rows).toHaveLength(1);
  });

  it("refuses to append onto a tampered execution chain", async () => {
    await service.propose("execution-tampered", proposal(), "admin:alice");
    rows[0].payload.proposedMutation.summary = "tampered after commit";

    await expect(
      service.recordApproval(
        "execution-tampered",
        { decision: "APPROVED", reason: "Looks bounded", evidence: [] },
        "admin:bob",
      ),
    ).rejects.toThrow(ConflictException);
    expect(rows).toHaveLength(1);
  });

  it("fails closed after a human rejection", async () => {
    await service.propose("execution-3", proposal(), "admin:alice");
    await service.recordApproval(
      "execution-3",
      { decision: "REJECTED", reason: "Authority is too broad", evidence: [] },
      "admin:bob",
    );

    await expect(
      service.recordMutation(
        "execution-3",
        { outcome: "SUCCEEDED", receipt: "receipt:3", evidence: [] },
        "service:executor",
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("never lets an approval override a policy denial", async () => {
    await service.propose(
      "execution-4",
      proposal({
        policyDecision: {
          ...proposal().policyDecision,
          outcome: "DENY",
        },
      }),
      "admin:alice",
    );

    await expect(
      service.recordMutation(
        "execution-4",
        { outcome: "SUCCEEDED", receipt: "receipt:4", evidence: [] },
        "service:executor",
      ),
    ).rejects.toThrow(ForbiddenException);
    const execution = await service.getExecution("execution-4");
    expect(execution.state.status).toBe("POLICY_BLOCKED");
  });

  it("rejects expired delegated authority", async () => {
    await expect(
      service.propose(
        "execution-5",
        proposal({
          delegatedAuthority: {
            ...proposal().delegatedAuthority,
            expiresAt: "2020-01-01T00:00:00.000Z",
          },
        }),
        "admin:alice",
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("rechecks delegated-authority expiry before the mutation receipt", async () => {
    const now = Date.now();
    await service.propose(
      "execution-expiry",
      proposal({
        delegatedAuthority: {
          ...proposal().delegatedAuthority,
          expiresAt: new Date(now + 60_000).toISOString(),
        },
      }),
      "admin:alice",
    );
    await service.recordApproval(
      "execution-expiry",
      { decision: "APPROVED", reason: "Bounded action", evidence: [] },
      "admin:bob",
    );

    const clock = jest.spyOn(Date, "now").mockReturnValue(now + 120_000);
    try {
      await expect(
        service.recordMutation(
          "execution-expiry",
          { outcome: "SUCCEEDED", receipt: "receipt:expired", evidence: [] },
          "service:executor",
        ),
      ).rejects.toThrow(ForbiddenException);
    } finally {
      clock.mockRestore();
    }
  });

  it("rejects raw credentials and signed URLs from evidence payloads", async () => {
    const withSecret = proposal({
      evidence: [
        {
          kind: "source-record",
          uri: "https://example.test/object?X-Amz-Signature=raw-secret",
        },
      ],
    });

    await expect(
      service.propose("execution-6", withSecret, "admin:alice"),
    ).rejects.toThrow(BadRequestException);
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("requires an open dispute before accepting peer review", async () => {
    await service.propose("execution-7", proposal(), "admin:alice");

    await expect(
      service.recordPeerReview(
        "execution-7",
        { finding: "AFFIRMED", rationale: "Looks correct", evidence: [] },
        "admin:dave",
      ),
    ).rejects.toThrow(ConflictException);
  });

  it("records rollback as evidence without invoking an executor", async () => {
    await service.propose("execution-8", proposal(), "admin:alice");
    await service.recordApproval(
      "execution-8",
      { decision: "APPROVED", reason: "Bounded action", evidence: [] },
      "admin:bob",
    );
    await service.recordMutation(
      "execution-8",
      { outcome: "PARTIAL", receipt: "receipt:partial", evidence: [] },
      "service:executor",
    );
    await service.recordRollback(
      "execution-8",
      {
        outcome: "COMPLETED",
        reason: "Postcondition failed",
        receipt: "receipt:rollback",
        evidence: [],
      },
      "service:executor",
    );

    const execution = await service.getExecution("execution-8");
    expect(execution.state.status).toBe("ROLLED_BACK");
  });
});
