import { describe, it, expect } from "vitest";
import {
  OathCategory,
  VerificationMethod,
  getRecoveryState,
  RecoveryState,
  checkReentryEligibility,
  REENTRY_COOLDOWN_DAYS,
  REENTRY_MAX_ATTEMPTS,
  calculateHabitStrength,
  getHabitStrengthLabel,
  createDecoProof,
} from "../src/shared/libs/behavioral-logic";
import {
  HabituationStatus,
  detectHabituation,
  validateSwapEligibility,
  calculateSwapStake,
  BehaviorSwapStatus,
} from "../src/shared/libs/behavioral-enhancements";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Bifurcation Schema & Boundary Specifications
// ─────────────────────────────────────────────────────────────────────────────

export enum BifurcationDomain {
  PUBLIC_SURFACE = "PUBLIC_SURFACE",
  PRIVATE_ENGINE = "PRIVATE_ENGINE",
}

export interface PublicCommitmentPayload {
  contractId: string;
  userId: string;
  oathCategory: OathCategory;
  verificationMethod: VerificationMethod;
  durationDays: number;
  stakeCents: number;
  status: CommitmentStatus;
  createdAt: string;
}

export interface PrivateEnginePayload extends PublicCommitmentPayload {
  escrowVaultId: string;
  antiSybilScore: number;
  lossAversionCoefficient: number;
  riskQuadrant: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  custodyRoutingKey: string;
}

export interface BifurcationSchema {
  domain: BifurcationDomain;
  payload: PublicCommitmentPayload | PrivateEnginePayload;
  version: string;
}

/**
 * Validates whether a payload adheres to the public surface bifurcation schema.
 */
export function validatePublicBifurcationSchema(raw: unknown): {
  valid: boolean;
  errors: string[];
  data?: PublicCommitmentPayload;
} {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { valid: false, errors: ["Payload must be a non-null object"] };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.contractId !== "string" || !obj.contractId.trim()) {
    errors.push("contractId must be a non-empty string");
  }

  if (typeof obj.userId !== "string" || !obj.userId.trim()) {
    errors.push("userId must be a non-empty string");
  }

  if (
    typeof obj.oathCategory !== "string" ||
    !Object.values(OathCategory).includes(obj.oathCategory as OathCategory)
  ) {
    errors.push(`Invalid oathCategory: ${String(obj.oathCategory)}`);
  }

  if (
    typeof obj.verificationMethod !== "string" ||
    !Object.values(VerificationMethod).includes(
      obj.verificationMethod as VerificationMethod,
    )
  ) {
    errors.push(`Invalid verificationMethod: ${String(obj.verificationMethod)}`);
  }

  if (
    typeof obj.durationDays !== "number" ||
    !Number.isInteger(obj.durationDays) ||
    obj.durationDays <= 0
  ) {
    errors.push("durationDays must be a positive integer");
  }

  if (
    typeof obj.stakeCents !== "number" ||
    !Number.isInteger(obj.stakeCents) ||
    obj.stakeCents < 0
  ) {
    errors.push("stakeCents must be a non-negative integer");
  }

  if (
    typeof obj.status !== "string" ||
    !Object.values(CommitmentStatus).includes(obj.status as CommitmentStatus)
  ) {
    errors.push(`Invalid status: ${String(obj.status)}`);
  }

  if (
    typeof obj.createdAt !== "string" ||
    Number.isNaN(Date.parse(obj.createdAt))
  ) {
    errors.push("createdAt must be a valid ISO 8601 date string");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], data: obj as unknown as PublicCommitmentPayload };
}

/**
 * Validates whether a payload satisfies private engine bifurcation requirements.
 */
export function validatePrivateEngineBifurcationSchema(raw: unknown): {
  valid: boolean;
  errors: string[];
  data?: PrivateEnginePayload;
} {
  const publicRes = validatePublicBifurcationSchema(raw);
  const errors = [...publicRes.errors];

  if (!raw || typeof raw !== "object") {
    return { valid: false, errors };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.escrowVaultId !== "string" || !obj.escrowVaultId.trim()) {
    errors.push("escrowVaultId must be a non-empty string");
  }

  if (
    typeof obj.antiSybilScore !== "number" ||
    obj.antiSybilScore < 0 ||
    obj.antiSybilScore > 100
  ) {
    errors.push("antiSybilScore must be a number between 0 and 100");
  }

  if (
    typeof obj.lossAversionCoefficient !== "number" ||
    obj.lossAversionCoefficient <= 0
  ) {
    errors.push("lossAversionCoefficient must be a positive number");
  }

  if (
    typeof obj.riskQuadrant !== "string" ||
    !["LOW", "MODERATE", "HIGH", "CRITICAL"].includes(obj.riskQuadrant)
  ) {
    errors.push(`Invalid riskQuadrant: ${String(obj.riskQuadrant)}`);
  }

  if (typeof obj.custodyRoutingKey !== "string" || !obj.custodyRoutingKey.trim()) {
    errors.push("custodyRoutingKey must be a non-empty string");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], data: obj as unknown as PrivateEnginePayload };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Behavioral Commitment State Machine
// ─────────────────────────────────────────────────────────────────────────────

export enum CommitmentStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  PENDING_REVIEW = "PENDING_REVIEW",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  DISPUTED = "DISPUTED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export const ALLOWED_STATE_TRANSITIONS: Record<CommitmentStatus, CommitmentStatus[]> = {
  [CommitmentStatus.DRAFT]: [CommitmentStatus.PENDING, CommitmentStatus.ACTIVE, CommitmentStatus.CANCELLED],
  [CommitmentStatus.PENDING]: [CommitmentStatus.ACTIVE, CommitmentStatus.CANCELLED],
  [CommitmentStatus.ACTIVE]: [CommitmentStatus.PENDING_REVIEW, CommitmentStatus.FAILED, CommitmentStatus.EXPIRED],
  [CommitmentStatus.PENDING_REVIEW]: [CommitmentStatus.COMPLETED, CommitmentStatus.FAILED],
  [CommitmentStatus.FAILED]: [CommitmentStatus.DISPUTED, CommitmentStatus.EXPIRED],
  [CommitmentStatus.DISPUTED]: [CommitmentStatus.COMPLETED, CommitmentStatus.FAILED],
  [CommitmentStatus.COMPLETED]: [],
  [CommitmentStatus.EXPIRED]: [],
  [CommitmentStatus.CANCELLED]: [],
};

export function canTransitionCommitmentState(
  from: CommitmentStatus,
  to: CommitmentStatus,
): { allowed: boolean; reason?: string } {
  if (from === to) {
    return { allowed: false, reason: `State is already ${from}` };
  }

  const allowed = ALLOWED_STATE_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    return {
      allowed: false,
      reason: `Illegal state transition from ${from} to ${to}`,
    };
  }

  return { allowed: true };
}

export interface CommitmentStateContext {
  proofVerified?: boolean;
  disputeResolved?: boolean;
  disputeUpheld?: boolean;
  cancellationReason?: string;
}

export function transitionCommitmentState(
  currentContract: PublicCommitmentPayload,
  nextStatus: CommitmentStatus,
  context: CommitmentStateContext = {},
): { success: boolean; updatedContract?: PublicCommitmentPayload; error?: string } {
  const check = canTransitionCommitmentState(currentContract.status, nextStatus);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // Precondition validations
  if (
    currentContract.status === CommitmentStatus.PENDING_REVIEW &&
    nextStatus === CommitmentStatus.COMPLETED &&
    context.proofVerified === false
  ) {
    return {
      success: false,
      error: "Cannot transition to COMPLETED when proof verification fails",
    };
  }

  if (
    currentContract.status === CommitmentStatus.DISPUTED &&
    nextStatus === CommitmentStatus.COMPLETED &&
    context.disputeUpheld === false
  ) {
    return {
      success: false,
      error: "Cannot set state to COMPLETED when dispute was not upheld",
    };
  }

  const updatedContract: PublicCommitmentPayload = {
    ...currentContract,
    status: nextStatus,
  };

  return { success: true, updatedContract };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Unit Test Suite: Bifurcation Schemas & Commitment State Transitions
// ─────────────────────────────────────────────────────────────────────────────

describe("Bifurcation Schema Validation", () => {
  const validPublicPayload: PublicCommitmentPayload = {
    contractId: "ctr-101",
    userId: "usr-202",
    oathCategory: OathCategory.WEIGHT_MANAGEMENT,
    verificationMethod: VerificationMethod.HARDWARE_HEALTHKIT,
    durationDays: 30,
    stakeCents: 5000,
    status: CommitmentStatus.ACTIVE,
    createdAt: new Date().toISOString(),
  };

  const validPrivatePayload: PrivateEnginePayload = {
    ...validPublicPayload,
    escrowVaultId: "vlt-999",
    antiSybilScore: 98.5,
    lossAversionCoefficient: 1.955,
    riskQuadrant: "MODERATE",
    custodyRoutingKey: "rt-key-alpha-77",
  };

  it("validates a well-formed public surface commitment payload", () => {
    const res = validatePublicBifurcationSchema(validPublicPayload);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.data?.contractId).toBe("ctr-101");
  });

  it("validates a well-formed private engine commitment payload", () => {
    const res = validatePrivateEngineBifurcationSchema(validPrivatePayload);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.data?.escrowVaultId).toBe("vlt-999");
  });

  it("rejects non-object raw payloads gracefully", () => {
    expect(validatePublicBifurcationSchema(null).valid).toBe(false);
    expect(validatePublicBifurcationSchema(undefined).valid).toBe(false);
    expect(validatePublicBifurcationSchema("invalid string").valid).toBe(false);
    expect(validatePublicBifurcationSchema(12345).valid).toBe(false);
  });

  it("rejects public payload with missing or empty contractId and userId", () => {
    const invalid = { ...validPublicPayload, contractId: "   ", userId: "" };
    const res = validatePublicBifurcationSchema(invalid);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("contractId must be a non-empty string");
    expect(res.errors).toContain("userId must be a non-empty string");
  });

  it("rejects public payload with invalid oath category or verification method", () => {
    const invalid = {
      ...validPublicPayload,
      oathCategory: "INVALID_OATH",
      verificationMethod: "MAGIC_WAND",
    };
    const res = validatePublicBifurcationSchema(invalid);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("Invalid oathCategory"))).toBe(true);
    expect(res.errors.some((e) => e.includes("Invalid verificationMethod"))).toBe(true);
  });

  it("rejects public payload with invalid duration or stake bounds", () => {
    const invalid = {
      ...validPublicPayload,
      durationDays: -5,
      stakeCents: -100,
    };
    const res = validatePublicBifurcationSchema(invalid);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("durationDays must be a positive integer");
    expect(res.errors).toContain("stakeCents must be a non-negative integer");
  });

  it("rejects public payload with malformed ISO createdAt date string", () => {
    const invalid = { ...validPublicPayload, createdAt: "2026-99-99-not-a-date" };
    const res = validatePublicBifurcationSchema(invalid);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("createdAt must be a valid ISO 8601 date string");
  });

  it("rejects private payload when private engine security fields are missing", () => {
    const res = validatePrivateEngineBifurcationSchema(validPublicPayload);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("escrowVaultId must be a non-empty string");
    expect(res.errors).toContain("antiSybilScore must be a number between 0 and 100");
    expect(res.errors).toContain("lossAversionCoefficient must be a positive number");
    expect(res.errors).toContain("custodyRoutingKey must be a non-empty string");
  });

  it("rejects private payload with out-of-bounds antiSybilScore and invalid risk quadrant", () => {
    const invalid = {
      ...validPrivatePayload,
      antiSybilScore: 150,
      riskQuadrant: "EXTREME_HAZARD",
    };
    const res = validatePrivateEngineBifurcationSchema(invalid);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("antiSybilScore must be a number between 0 and 100");
    expect(res.errors.some((e) => e.includes("Invalid riskQuadrant"))).toBe(true);
  });
});

describe("Behavioral Commitment State Transitions", () => {
  const baseContract: PublicCommitmentPayload = {
    contractId: "ctr-555",
    userId: "usr-777",
    oathCategory: OathCategory.DEEP_WORK_FOCUS,
    verificationMethod: VerificationMethod.API_SCREEN_TIME,
    durationDays: 14,
    stakeCents: 2500,
    status: CommitmentStatus.DRAFT,
    createdAt: new Date().toISOString(),
  };

  it("permits valid linear state progression: DRAFT -> ACTIVE -> PENDING_REVIEW -> COMPLETED", () => {
    // DRAFT -> ACTIVE
    let res = transitionCommitmentState(baseContract, CommitmentStatus.ACTIVE);
    expect(res.success).toBe(true);
    let activeContract = res.updatedContract!;
    expect(activeContract.status).toBe(CommitmentStatus.ACTIVE);

    // ACTIVE -> PENDING_REVIEW
    res = transitionCommitmentState(activeContract, CommitmentStatus.PENDING_REVIEW);
    expect(res.success).toBe(true);
    let pendingContract = res.updatedContract!;
    expect(pendingContract.status).toBe(CommitmentStatus.PENDING_REVIEW);

    // PENDING_REVIEW -> COMPLETED with verified proof
    res = transitionCommitmentState(pendingContract, CommitmentStatus.COMPLETED, {
      proofVerified: true,
    });
    expect(res.success).toBe(true);
    expect(res.updatedContract?.status).toBe(CommitmentStatus.COMPLETED);
  });

  it("permits dispute escalation flow: ACTIVE -> PENDING_REVIEW -> FAILED -> DISPUTED -> COMPLETED", () => {
    let contract = { ...baseContract, status: CommitmentStatus.ACTIVE };

    // ACTIVE -> PENDING_REVIEW
    let res = transitionCommitmentState(contract, CommitmentStatus.PENDING_REVIEW);
    expect(res.success).toBe(true);
    contract = res.updatedContract!;

    // PENDING_REVIEW -> FAILED
    res = transitionCommitmentState(contract, CommitmentStatus.FAILED);
    expect(res.success).toBe(true);
    contract = res.updatedContract!;

    // FAILED -> DISPUTED
    res = transitionCommitmentState(contract, CommitmentStatus.DISPUTED);
    expect(res.success).toBe(true);
    contract = res.updatedContract!;

    // DISPUTED -> COMPLETED (when dispute is upheld)
    res = transitionCommitmentState(contract, CommitmentStatus.COMPLETED, {
      disputeUpheld: true,
    });
    expect(res.success).toBe(true);
    expect(res.updatedContract?.status).toBe(CommitmentStatus.COMPLETED);
  });

  it("rejects transitioning from terminal states COMPLETED, EXPIRED, CANCELLED", () => {
    const completedContract = { ...baseContract, status: CommitmentStatus.COMPLETED };
    const expiredContract = { ...baseContract, status: CommitmentStatus.EXPIRED };
    const cancelledContract = { ...baseContract, status: CommitmentStatus.CANCELLED };

    expect(
      canTransitionCommitmentState(completedContract.status, CommitmentStatus.ACTIVE).allowed,
    ).toBe(false);
    expect(
      canTransitionCommitmentState(expiredContract.status, CommitmentStatus.ACTIVE).allowed,
    ).toBe(false);
    expect(
      canTransitionCommitmentState(cancelledContract.status, CommitmentStatus.PENDING_REVIEW).allowed,
    ).toBe(false);
  });

  it("rejects illegal backward or skip transitions", () => {
    // COMPLETED -> FAILED
    expect(
      canTransitionCommitmentState(CommitmentStatus.COMPLETED, CommitmentStatus.FAILED).allowed,
    ).toBe(false);

    // DRAFT -> COMPLETED
    expect(
      canTransitionCommitmentState(CommitmentStatus.DRAFT, CommitmentStatus.COMPLETED).allowed,
    ).toBe(false);

    // DISPUTED -> DRAFT
    expect(
      canTransitionCommitmentState(CommitmentStatus.DISPUTED, CommitmentStatus.DRAFT).allowed,
    ).toBe(false);
  });

  it("enforces precondition guard when attempting to mark COMPLETED without verified proof", () => {
    const pendingContract = { ...baseContract, status: CommitmentStatus.PENDING_REVIEW };
    const res = transitionCommitmentState(pendingContract, CommitmentStatus.COMPLETED, {
      proofVerified: false,
    });
    expect(res.success).toBe(false);
    expect(res.error).toBe(
      "Cannot transition to COMPLETED when proof verification fails",
    );
  });

  it("enforces precondition guard when attempting to mark COMPLETED from DISPUTED when dispute is rejected", () => {
    const disputedContract = { ...baseContract, status: CommitmentStatus.DISPUTED };
    const res = transitionCommitmentState(disputedContract, CommitmentStatus.COMPLETED, {
      disputeUpheld: false,
    });
    expect(res.success).toBe(false);
    expect(res.error).toBe(
      "Cannot set state to COMPLETED when dispute was not upheld",
    );
  });
});

describe("Behavior Swap Contract State Transitions", () => {
  it("validates swap eligibility for active contracts meeting duration and limit criteria", () => {
    const valid = validateSwapEligibility(15, "ACTIVE", 0);
    expect(valid.eligible).toBe(true);

    const inactive = validateSwapEligibility(15, "COMPLETED", 0);
    expect(inactive.eligible).toBe(false);
    expect(inactive.reason).toBe("Source contract must be active");

    const tooEarly = validateSwapEligibility(5, "ACTIVE", 0);
    expect(tooEarly.eligible).toBe(false);
    expect(tooEarly.reason).toContain("Must wait 14 days");

    const limitExceeded = validateSwapEligibility(20, "ACTIVE", 2);
    expect(limitExceeded.eligible).toBe(false);
    expect(limitExceeded.reason).toBe("Maximum of 2 behavior swaps per contract");
  });

  it("calculates swap stake carryover bounded between 10% and 100%", () => {
    expect(calculateSwapStake(100, 50)).toBe(50);
    expect(calculateSwapStake(100, 5)).toBe(10); // clamped to min 10%
    expect(calculateSwapStake(100, 150)).toBe(100); // clamped to max 100%
  });
});

describe("Recovery & Habit Physics State Transitions", () => {
  it("maps recovery timeline days and weekend triggers to exact RecoveryStates", () => {
    expect(getRecoveryState(5, false)).toBe(RecoveryState.LOCKDOWN);
    expect(getRecoveryState(14, false)).toBe(RecoveryState.LOCKDOWN);
    expect(getRecoveryState(20, true)).toBe(RecoveryState.WEEKEND_SHIELD);
    expect(getRecoveryState(21, false)).toBe(RecoveryState.REWARD_INJECTION);
    expect(getRecoveryState(50, false)).toBe(RecoveryState.FRICTION_DELAY);
    expect(getRecoveryState(90, false)).toBe(RecoveryState.ALPHA_COMPLETE);
    expect(getRecoveryState(35, false)).toBe(RecoveryState.NORMAL);
  });

  it("verifies re-entry eligibility cooldown and discount rules", () => {
    const blockedByCooldown = checkReentryEligibility({
      daysSinceLastFailure: 3,
      previousFailureCount: 1,
      previousStakeCents: 5000,
    });
    expect(blockedByCooldown.eligible).toBe(false);
    expect(blockedByCooldown.reason).toContain("Re-entry cooldown: 4 days remaining");

    const blockedByMaxAttempts = checkReentryEligibility({
      daysSinceLastFailure: 10,
      previousFailureCount: REENTRY_MAX_ATTEMPTS,
      previousStakeCents: 5000,
    });
    expect(blockedByMaxAttempts.eligible).toBe(false);
    expect(blockedByMaxAttempts.reason).toContain("Maximum re-entry attempts");

    const eligible = checkReentryEligibility({
      daysSinceLastFailure: REENTRY_COOLDOWN_DAYS + 1,
      previousFailureCount: 1,
      previousStakeCents: 5000,
    });
    expect(eligible.eligible).toBe(true);
    expect(eligible.reducedStakeCents).toBe(2500); // 50% discount
    expect(eligible.attemptNumber).toBe(2);
  });

  it("evaluates habituation status transitions and suggested disruptions", () => {
    const normal = detectHabituation(10, [1.0, 1.0], 0.01);
    expect(normal.status).toBe(HabituationStatus.NORMAL);

    const decay = detectHabituation(20, [0.4, 0.5], 0.2);
    expect(decay.status).toBe(HabituationStatus.EARLY_DECAY);
    expect(decay.suggestedDisruption).toContain("surprise challenge");

    const habituated = detectHabituation(35, [0.95, 0.98], 0.02);
    expect(habituated.status).toBe(HabituationStatus.HABITUATED);
    expect(habituated.suggestedDisruption).toContain("behavior swap contract");
  });

  it("calculates habit strength logistic automaticity curve and labels", () => {
    const earlyStrength = calculateHabitStrength(10, 30);
    expect(earlyStrength).toBeLessThan(0.1);
    expect(getHabitStrengthLabel(earlyStrength)).toBe("Fragile");

    const developingStrength = calculateHabitStrength(66, 100);
    expect(developingStrength).toBeCloseTo(0.5, 1);
    expect(getHabitStrengthLabel(developingStrength)).toBe("Developing");

    const automaticStrength = calculateHabitStrength(120, 150);
    expect(automaticStrength).toBeGreaterThan(0.95);
    expect(getHabitStrengthLabel(automaticStrength)).toBe("Automatic");
  });
});

describe("DECO Proof Verification Edge Cases", () => {
  it("generates deterministic commitment hashes for DECO proofs", async () => {
    const req = {
      url: "https://app.styx.trade/metrics",
      selector: "#workout-count",
      expectedValue: "30",
    };

    const res1 = await createDecoProof(req);
    expect(res1.verified).toBe(true);
    expect(res1.commitmentHash).toHaveLength(64); // SHA-256 hex string
    expect(res1.revealedFields).toEqual(["#workout-count"]);
  });
});
