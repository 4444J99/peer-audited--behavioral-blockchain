import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomUUID } from "crypto";
import { Pool, PoolClient } from "pg";
import { TruthLogService } from "../../../services/ledger/truth-log.service";
import type {
  AgentActionEventPayload,
  AgentActionEventType,
  AgentActionEvidenceEvent,
  AgentActionExecution,
  AgentActionExecutionState,
  ApprovalPayload,
  DisputePayload,
  MutationPayload,
  PeerReviewPayload,
  ProposalPayload,
  RollbackPayload,
  VerificationPayload,
} from "./agent-action-evidence.types";
import type {
  OpenDisputeDto,
  ProposeAgentActionDto,
  RecordApprovalDto,
  RecordMutationDto,
  RecordPeerReviewDto,
  RecordRollbackDto,
  RecordVerificationDto,
} from "./dto";

const EVIDENCE_SCHEMA_VERSION = "organvm.execution/v1" as const;
const GENESIS_EVENT_HASH = "0".repeat(64);
const IDENTIFIER_RE = /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/;
const SECRET_KEY_RE =
  /(?:api[_-]?key|secret|token|password|authorization|cookie|private[_-]?key|credential)/i;
const SECRET_VALUE_RE =
  /^\s*(?:Bearer\s+|Basic\s+|sk-|gh[pousr]_|xox[baprs]-|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY)/i;
const SECRET_QUERY_RE =
  /[?&](?:[^=&]*(?:token|secret|signature|credential|api[_-]?key)[^=&]*)=/i;

interface EvidenceEventRow {
  id: string;
  schema_version: string;
  execution_id: string;
  sequence_index: string | number;
  event_type: AgentActionEventType;
  producer: string;
  recorded_by: string;
  payload: AgentActionEventPayload;
  previous_event_hash: string;
  event_hash: string;
  truth_log_event_id: string;
  created_at: Date | string;
}

@Injectable()
export class AgentActionEvidenceService {
  constructor(
    private readonly pool: Pool,
    private readonly truthLog: TruthLogService,
  ) {}

  async propose(
    executionId: string,
    dto: ProposeAgentActionDto,
    recordedBy: string,
  ): Promise<AgentActionEvidenceEvent> {
    this.assertIdentifier("executionId", executionId, 200);
    this.assertIdentifier("recordedBy", recordedBy, 200);
    if (dto.delegatedAuthority.scopes.length === 0) {
      throw new BadRequestException(
        "delegatedAuthority.scopes must not be empty",
      );
    }
    if (dto.evidence.length === 0 && dto.toolCalls.length === 0) {
      throw new BadRequestException(
        "A proposal requires source evidence or a tool-call receipt",
      );
    }
    if (
      dto.policyDecision.outcome === "REQUIRE_APPROVAL" &&
      !dto.requiresHumanApproval
    ) {
      throw new BadRequestException(
        "requiresHumanApproval must be true when policy outcome is REQUIRE_APPROVAL",
      );
    }
    if (
      dto.delegatedAuthority.expiresAt &&
      Date.parse(dto.delegatedAuthority.expiresAt) <= Date.now()
    ) {
      throw new ForbiddenException("Delegated authority is expired");
    }
    dto.evidence.forEach((item, index) =>
      this.assertEvidenceReference(item, `evidence[${index}]`),
    );

    const payload: ProposalPayload = {
      actingPrincipal: dto.actingPrincipal,
      delegatedAuthority: dto.delegatedAuthority,
      policyDecision: dto.policyDecision,
      evidence: dto.evidence,
      toolCalls: dto.toolCalls,
      proposedMutation: dto.proposedMutation,
      requiresHumanApproval: dto.requiresHumanApproval,
    };
    return this.appendEvent(
      executionId,
      dto.producer,
      "PROPOSED",
      payload,
      recordedBy,
    );
  }

  recordApproval(
    executionId: string,
    dto: RecordApprovalDto,
    decidedBy: string,
  ): Promise<AgentActionEvidenceEvent> {
    const payload: ApprovalPayload = {
      decision: dto.decision,
      decidedBy,
      reason: dto.reason,
      evidence: dto.evidence,
    };
    return this.appendEvent(
      executionId,
      undefined,
      "APPROVAL_RECORDED",
      payload,
      decidedBy,
    );
  }

  recordMutation(
    executionId: string,
    dto: RecordMutationDto,
    recordedBy: string,
  ): Promise<AgentActionEvidenceEvent> {
    const payload: MutationPayload = {
      outcome: dto.outcome,
      receipt: dto.receipt,
      beforeDigest: dto.beforeDigest,
      afterDigest: dto.afterDigest,
      evidence: dto.evidence,
    };
    return this.appendEvent(
      executionId,
      undefined,
      "MUTATION_RECORDED",
      payload,
      recordedBy,
    );
  }

  recordVerification(
    executionId: string,
    dto: RecordVerificationDto,
    recordedBy: string,
  ): Promise<AgentActionEvidenceEvent> {
    const payload: VerificationPayload = {
      outcome: dto.outcome,
      checks: dto.checks,
      evidence: dto.evidence,
    };
    return this.appendEvent(
      executionId,
      undefined,
      "VERIFICATION_RECORDED",
      payload,
      recordedBy,
    );
  }

  recordRollback(
    executionId: string,
    dto: RecordRollbackDto,
    recordedBy: string,
  ): Promise<AgentActionEvidenceEvent> {
    const payload: RollbackPayload = {
      outcome: dto.outcome,
      reason: dto.reason,
      receipt: dto.receipt,
      evidence: dto.evidence,
    };
    return this.appendEvent(
      executionId,
      undefined,
      "ROLLBACK_RECORDED",
      payload,
      recordedBy,
    );
  }

  openDispute(
    executionId: string,
    dto: OpenDisputeDto,
    openedBy: string,
  ): Promise<AgentActionEvidenceEvent> {
    const payload: DisputePayload = {
      openedBy,
      reason: dto.reason,
      evidence: dto.evidence,
    };
    return this.appendEvent(
      executionId,
      undefined,
      "DISPUTE_OPENED",
      payload,
      openedBy,
    );
  }

  recordPeerReview(
    executionId: string,
    dto: RecordPeerReviewDto,
    reviewerId: string,
  ): Promise<AgentActionEvidenceEvent> {
    const payload: PeerReviewPayload = {
      reviewerId,
      finding: dto.finding,
      rationale: dto.rationale,
      evidence: dto.evidence,
    };
    return this.appendEvent(
      executionId,
      undefined,
      "PEER_REVIEW_RECORDED",
      payload,
      reviewerId,
    );
  }

  async getExecution(executionId: string): Promise<AgentActionExecution> {
    this.assertIdentifier("executionId", executionId, 200);
    const result = await this.pool.query<EvidenceEventRow>(
      `SELECT id, schema_version, execution_id, sequence_index, event_type,
              producer, recorded_by, payload, previous_event_hash, event_hash,
              truth_log_event_id, created_at
         FROM agent_action_evidence_events
        WHERE execution_id = $1
        ORDER BY sequence_index ASC`,
      [executionId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(
        `Agent action execution ${executionId} was not found`,
      );
    }

    const events = result.rows.map((row) => this.toEvent(row));
    const integrity = this.verifyEventChain(events);
    return {
      executionId,
      producer: events[0].producer,
      integrity,
      state: this.deriveState(events),
      events,
    };
  }

  private async appendEvent(
    executionId: string,
    requestedProducer: string | undefined,
    eventType: AgentActionEventType,
    payload: AgentActionEventPayload,
    recordedBy: string,
  ): Promise<AgentActionEvidenceEvent> {
    this.assertIdentifier("executionId", executionId, 200);
    this.assertIdentifier("recordedBy", recordedBy, 200);
    this.assertNoSecrets(payload);
    this.assertPayloadEvidence(payload);

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        executionId,
      ]);

      const existing = await this.loadForUpdate(client, executionId);
      if (existing.length > 0) {
        const integrity = this.verifyEventChain(
          existing.map((row) => this.toEvent(row)),
        );
        if (!integrity.valid) {
          throw new ConflictException(
            "The existing execution evidence failed integrity verification",
          );
        }
      }
      this.assertTransition(existing, eventType, payload);

      const producer = requestedProducer ?? existing[0]?.producer;
      if (!producer) {
        throw new BadRequestException(
          "producer is required for the first execution event",
        );
      }
      this.assertIdentifier("producer", producer, 100);

      const sequenceIndex =
        existing.length > 0
          ? Number(existing[existing.length - 1].sequence_index) + 1
          : 1;
      const previousEventHash =
        existing.length > 0
          ? existing[existing.length - 1].event_hash
          : GENESIS_EVENT_HASH;
      const createdAt = new Date().toISOString();
      const id = randomUUID();
      const eventHash = this.computeEventHash({
        executionId,
        sequenceIndex,
        eventType,
        producer,
        recordedBy,
        payload,
        previousEventHash,
        createdAt,
      });

      // The global truth log receives only identifiers and digests. Source content
      // stays in the access-controlled evidence table, avoiding accidental leakage
      // into public or cross-domain event feeds.
      const truthLogEventId = await this.truthLog.appendEvent(
        "AGENT_ACTION_EVIDENCE_RECORDED",
        {
          evidenceEventId: id,
          executionId,
          sequenceIndex,
          eventType,
          producer,
          recordedBy,
          eventHash,
        },
        client,
      );

      const inserted = await client.query<EvidenceEventRow>(
        `INSERT INTO agent_action_evidence_events (
           id, schema_version, execution_id, sequence_index, event_type,
           producer, recorded_by, payload, previous_event_hash, event_hash,
           truth_log_event_id, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, schema_version, execution_id, sequence_index, event_type,
                   producer, recorded_by, payload, previous_event_hash, event_hash,
                   truth_log_event_id, created_at`,
        [
          id,
          EVIDENCE_SCHEMA_VERSION,
          executionId,
          sequenceIndex,
          eventType,
          producer,
          recordedBy,
          payload,
          previousEventHash,
          eventHash,
          truthLogEventId,
          createdAt,
        ],
      );

      await client.query("COMMIT");
      return this.toEvent(inserted.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async loadForUpdate(
    client: PoolClient,
    executionId: string,
  ): Promise<EvidenceEventRow[]> {
    const result = await client.query<EvidenceEventRow>(
      `SELECT id, schema_version, execution_id, sequence_index, event_type,
              producer, recorded_by, payload, previous_event_hash, event_hash,
              truth_log_event_id, created_at
         FROM agent_action_evidence_events
        WHERE execution_id = $1
        ORDER BY sequence_index ASC
        FOR UPDATE`,
      [executionId],
    );
    return result.rows;
  }

  private assertTransition(
    existing: EvidenceEventRow[],
    eventType: AgentActionEventType,
    payload: AgentActionEventPayload,
  ): void {
    if (eventType === "PROPOSED") {
      if (existing.length > 0) {
        throw new ConflictException("An execution can be proposed only once");
      }
      return;
    }

    if (existing.length === 0 || existing[0].event_type !== "PROPOSED") {
      throw new NotFoundException(
        "The execution must be proposed before evidence can be appended",
      );
    }

    const proposal = existing[0].payload as ProposalPayload;
    const has = (type: AgentActionEventType) =>
      existing.some((event) => event.event_type === type);
    const approval = existing.find(
      (event) => event.event_type === "APPROVAL_RECORDED",
    )?.payload as ApprovalPayload | undefined;

    switch (eventType) {
      case "APPROVAL_RECORDED":
        if (!proposal.requiresHumanApproval) {
          throw new ConflictException(
            "This execution does not require human approval",
          );
        }
        if (proposal.policyDecision.outcome === "DENY") {
          throw new ForbiddenException(
            "A policy-denied execution cannot be approved",
          );
        }
        if (has("APPROVAL_RECORDED")) {
          throw new ConflictException(
            "An approval decision has already been recorded",
          );
        }
        if ((payload as ApprovalPayload).decision === "APPROVED") {
          this.assertAuthorityActive(proposal);
        }
        break;
      case "MUTATION_RECORDED":
        this.assertAuthorityActive(proposal);
        if (proposal.policyDecision.outcome === "DENY") {
          throw new ForbiddenException("Policy denied the proposed mutation");
        }
        if (
          proposal.requiresHumanApproval &&
          approval?.decision !== "APPROVED"
        ) {
          throw new ForbiddenException(
            "Human approval is required before recording a mutation",
          );
        }
        if (has("MUTATION_RECORDED")) {
          throw new ConflictException(
            "A mutation result has already been recorded",
          );
        }
        break;
      case "VERIFICATION_RECORDED":
        if (!has("MUTATION_RECORDED")) {
          throw new ConflictException(
            "A mutation result must exist before verification",
          );
        }
        if (has("VERIFICATION_RECORDED")) {
          throw new ConflictException(
            "A verification result has already been recorded",
          );
        }
        break;
      case "ROLLBACK_RECORDED":
        if (!has("MUTATION_RECORDED")) {
          throw new ConflictException(
            "A mutation result must exist before rollback",
          );
        }
        if (has("ROLLBACK_RECORDED")) {
          throw new ConflictException(
            "A rollback result has already been recorded",
          );
        }
        break;
      case "DISPUTE_OPENED":
        if (has("DISPUTE_OPENED")) {
          throw new ConflictException(
            "A dispute is already open for this execution",
          );
        }
        break;
      case "PEER_REVIEW_RECORDED":
        if (!has("DISPUTE_OPENED")) {
          throw new ConflictException(
            "A dispute must be open before peer review",
          );
        }
        if (has("PEER_REVIEW_RECORDED")) {
          throw new ConflictException(
            "A peer-review finding has already been recorded",
          );
        }
        break;
    }

    // Payload is deliberately referenced here so TypeScript verifies every
    // transition caller supplied one of the declared versioned payloads.
    void payload;
  }

  private assertAuthorityActive(proposal: ProposalPayload): void {
    const expiresAt = proposal.delegatedAuthority.expiresAt;
    if (!expiresAt) return;
    const expiry = Date.parse(expiresAt);
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      throw new ForbiddenException("Delegated authority is expired");
    }
  }

  private assertEvidenceReference(
    item: { uri?: string; digest?: string; summary?: string },
    path: string,
  ): void {
    if (!item.uri && !item.digest && !item.summary) {
      throw new BadRequestException(`${path} requires uri, digest, or summary`);
    }
  }

  private assertPayloadEvidence(payload: AgentActionEventPayload): void {
    if ("evidence" in payload) {
      payload.evidence.forEach((item, index) =>
        this.assertEvidenceReference(item, `evidence[${index}]`),
      );
    }
  }

  private assertIdentifier(
    name: string,
    value: string,
    maxLength: number,
  ): void {
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.length > maxLength ||
      !IDENTIFIER_RE.test(value)
    ) {
      throw new BadRequestException(
        `${name} must be 1-${maxLength} characters using letters, numbers, '.', '_', ':', '/', or '-'`,
      );
    }
  }

  private assertNoSecrets(value: unknown, path = "payload"): void {
    if (typeof value === "string") {
      if (SECRET_VALUE_RE.test(value) || SECRET_QUERY_RE.test(value)) {
        throw new BadRequestException(
          `Secret material is prohibited at ${path}`,
        );
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        this.assertNoSecrets(item, `${path}[${index}]`),
      );
      return;
    }
    if (!value || typeof value !== "object") return;

    for (const [key, nested] of Object.entries(value)) {
      if (SECRET_KEY_RE.test(key)) {
        throw new BadRequestException(
          `Secret-bearing field names are prohibited at ${path}.${key}`,
        );
      }
      this.assertNoSecrets(nested, `${path}.${key}`);
    }
  }

  private computeEventHash(input: {
    executionId: string;
    sequenceIndex: number;
    eventType: AgentActionEventType;
    producer: string;
    recordedBy: string;
    payload: AgentActionEventPayload;
    previousEventHash: string;
    createdAt: string;
  }): string {
    const preimage = [
      EVIDENCE_SCHEMA_VERSION,
      input.executionId,
      input.sequenceIndex,
      input.eventType,
      input.producer,
      input.recordedBy,
      input.createdAt,
      input.previousEventHash,
      this.canonicalStringify(input.payload),
    ].join("|");
    return createHash("sha256").update(preimage).digest("hex");
  }

  private canonicalStringify(value: unknown): string {
    if (value === null) return "null";
    if (typeof value === "string" || typeof value === "boolean") {
      return JSON.stringify(value);
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value))
        throw new BadRequestException(
          "Non-finite numbers are not valid evidence",
        );
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.canonicalStringify(item)).join(",")}]`;
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const entries = Object.keys(record)
        .filter((key) => record[key] !== undefined)
        .sort()
        .map(
          (key) =>
            `${JSON.stringify(key)}:${this.canonicalStringify(record[key])}`,
        );
      return `{${entries.join(",")}}`;
    }
    throw new BadRequestException("Evidence contains an unsupported value");
  }

  private toEvent(row: EvidenceEventRow): AgentActionEvidenceEvent {
    return {
      id: row.id,
      schemaVersion: row.schema_version as "organvm.execution/v1",
      executionId: row.execution_id,
      sequenceIndex: Number(row.sequence_index),
      eventType: row.event_type,
      producer: row.producer,
      recordedBy: row.recorded_by,
      payload: row.payload,
      previousEventHash: row.previous_event_hash,
      eventHash: row.event_hash,
      truthLogEventId: row.truth_log_event_id,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  private verifyEventChain(
    events: AgentActionEvidenceEvent[],
  ): AgentActionExecution["integrity"] {
    const corruptedEventIds: string[] = [];
    let previousEventHash = GENESIS_EVENT_HASH;

    for (const event of events) {
      if (event.previousEventHash !== previousEventHash) {
        corruptedEventIds.push(event.id);
      }
      const recomputed = this.computeEventHash({
        executionId: event.executionId,
        sequenceIndex: event.sequenceIndex,
        eventType: event.eventType,
        producer: event.producer,
        recordedBy: event.recordedBy,
        payload: event.payload,
        previousEventHash,
        createdAt: event.createdAt,
      });
      if (
        recomputed !== event.eventHash &&
        !corruptedEventIds.includes(event.id)
      ) {
        corruptedEventIds.push(event.id);
      }
      previousEventHash = event.eventHash;
    }

    return {
      valid: corruptedEventIds.length === 0,
      checked: events.length,
      corruptedEventIds,
    };
  }

  private deriveState(
    events: AgentActionEvidenceEvent[],
  ): AgentActionExecutionState {
    const proposal = events[0].payload as ProposalPayload;
    const approval = events.find(
      (event) => event.eventType === "APPROVAL_RECORDED",
    )?.payload as ApprovalPayload | undefined;
    const mutation = events.find(
      (event) => event.eventType === "MUTATION_RECORDED",
    )?.payload as MutationPayload | undefined;
    const verification = events.find(
      (event) => event.eventType === "VERIFICATION_RECORDED",
    )?.payload as VerificationPayload | undefined;
    const rollback = events.find(
      (event) => event.eventType === "ROLLBACK_RECORDED",
    )?.payload as RollbackPayload | undefined;
    const disputed = events.some(
      (event) => event.eventType === "DISPUTE_OPENED",
    );
    const peerReview = events.find(
      (event) => event.eventType === "PEER_REVIEW_RECORDED",
    )?.payload as PeerReviewPayload | undefined;

    let status: AgentActionExecutionState["status"] = "PROPOSED";
    if (proposal.policyDecision.outcome === "DENY") status = "POLICY_BLOCKED";
    else if (proposal.requiresHumanApproval && !approval)
      status = "AWAITING_APPROVAL";
    if (approval?.decision === "APPROVED") status = "APPROVED";
    if (approval?.decision === "REJECTED") status = "REJECTED";
    if (mutation) status = "MUTATED";
    if (verification?.outcome === "PASSED") status = "VERIFIED";
    if (verification?.outcome === "FAILED") status = "VERIFICATION_FAILED";
    if (rollback?.outcome === "COMPLETED") status = "ROLLED_BACK";
    if (rollback?.outcome === "FAILED") status = "ROLLBACK_FAILED";
    if (disputed) status = "DISPUTED";
    if (peerReview) status = "REVIEWED";

    return {
      status,
      policyOutcome: proposal.policyDecision.outcome,
      requiresHumanApproval: proposal.requiresHumanApproval,
      approvalDecision: approval?.decision,
      mutationOutcome: mutation?.outcome,
      verificationOutcome: verification?.outcome,
      rollbackOutcome: rollback?.outcome,
      disputed,
      peerReviewFinding: peerReview?.finding,
    };
  }
}
