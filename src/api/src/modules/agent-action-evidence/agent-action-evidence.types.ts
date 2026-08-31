export const AGENT_ACTION_EVENT_TYPES = [
  "PROPOSED",
  "APPROVAL_RECORDED",
  "MUTATION_RECORDED",
  "VERIFICATION_RECORDED",
  "ROLLBACK_RECORDED",
  "DISPUTE_OPENED",
  "PEER_REVIEW_RECORDED",
] as const;

export type AgentActionEventType = (typeof AGENT_ACTION_EVENT_TYPES)[number];

export type PrincipalType = "HUMAN" | "SERVICE" | "AGENT";
export type PolicyOutcome = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
export type ApprovalDecision = "APPROVED" | "REJECTED";
export type MutationOutcome = "SUCCEEDED" | "FAILED" | "PARTIAL";
export type VerificationOutcome = "PASSED" | "FAILED";
export type RollbackOutcome = "COMPLETED" | "FAILED";
export type PeerReviewFinding = "AFFIRMED" | "REVERSED" | "NEEDS_REMEDIATION";

export interface AgentPrincipal {
  id: string;
  type: PrincipalType;
  organization?: string;
}

export interface DelegatedAuthority {
  grantor: AgentPrincipal;
  scopes: string[];
  constraints: string[];
  grantReference?: string;
  expiresAt?: string;
}

export interface PolicyDecision {
  outcome: PolicyOutcome;
  policyId: string;
  policyVersion: string;
  reasons: string[];
  evaluatedAt: string;
}

export interface EvidenceReference {
  kind: string;
  uri?: string;
  digest?: string;
  summary?: string;
  observedAt?: string;
}

export interface ToolCallReceipt {
  tool: string;
  invocationId: string;
  outcome: "SUCCEEDED" | "FAILED";
  requestDigest?: string;
  responseDigest?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface ProposedMutation {
  kind: string;
  target: string;
  operation: string;
  summary: string;
  idempotencyKey?: string;
}

export interface ProposalPayload {
  actingPrincipal: AgentPrincipal;
  delegatedAuthority: DelegatedAuthority;
  policyDecision: PolicyDecision;
  evidence: EvidenceReference[];
  toolCalls: ToolCallReceipt[];
  proposedMutation: ProposedMutation;
  requiresHumanApproval: boolean;
}

export interface ApprovalPayload {
  decision: ApprovalDecision;
  decidedBy: string;
  reason: string;
  evidence: EvidenceReference[];
}

export interface MutationPayload {
  outcome: MutationOutcome;
  receipt: string;
  beforeDigest?: string;
  afterDigest?: string;
  evidence: EvidenceReference[];
}

export interface VerificationPayload {
  outcome: VerificationOutcome;
  checks: string[];
  evidence: EvidenceReference[];
}

export interface RollbackPayload {
  outcome: RollbackOutcome;
  reason: string;
  receipt: string;
  evidence: EvidenceReference[];
}

export interface DisputePayload {
  openedBy: string;
  reason: string;
  evidence: EvidenceReference[];
}

export interface PeerReviewPayload {
  reviewerId: string;
  finding: PeerReviewFinding;
  rationale: string;
  evidence: EvidenceReference[];
}

export type AgentActionEventPayload =
  | ProposalPayload
  | ApprovalPayload
  | MutationPayload
  | VerificationPayload
  | RollbackPayload
  | DisputePayload
  | PeerReviewPayload;

export interface AgentActionEvidenceEvent {
  id: string;
  schemaVersion: "organvm.execution/v1";
  executionId: string;
  sequenceIndex: number;
  eventType: AgentActionEventType;
  producer: string;
  recordedBy: string;
  payload: AgentActionEventPayload;
  previousEventHash: string;
  eventHash: string;
  truthLogEventId: string;
  createdAt: string;
}

export interface AgentActionExecutionState {
  status:
    | "PROPOSED"
    | "POLICY_BLOCKED"
    | "AWAITING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "MUTATED"
    | "VERIFIED"
    | "VERIFICATION_FAILED"
    | "ROLLED_BACK"
    | "ROLLBACK_FAILED"
    | "DISPUTED"
    | "REVIEWED";
  policyOutcome: PolicyOutcome;
  requiresHumanApproval: boolean;
  approvalDecision?: ApprovalDecision;
  mutationOutcome?: MutationOutcome;
  verificationOutcome?: VerificationOutcome;
  rollbackOutcome?: RollbackOutcome;
  disputed: boolean;
  peerReviewFinding?: PeerReviewFinding;
}

export interface AgentActionExecution {
  executionId: string;
  producer: string;
  integrity: {
    valid: boolean;
    checked: number;
    corruptedEventIds: string[];
  };
  state: AgentActionExecutionState;
  events: AgentActionEvidenceEvent[];
}
