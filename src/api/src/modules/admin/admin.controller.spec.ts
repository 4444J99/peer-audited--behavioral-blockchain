import { AdminController } from "./admin.controller";
import { ModerationService } from "../../../services/security/moderation.service";
import { CrisisDetectionService } from "../../../services/security/crisis-detection.service";
import { CrisisInterventionService } from "../../../services/security/crisis-intervention.service";
import { HoneypotService } from "../../../services/intelligence/honeypot.service";
import { AnomalyService } from "../../../services/anomaly/anomaly.service";
import { ContractsService } from "../contracts/contracts.service";
import { Pool } from "pg";
import { IdentityVerificationService } from "../compliance/identity-verification.service";

describe("AdminController", () => {
  let controller: AdminController;
  let mockPool: { query: jest.Mock };
  let mockAnomaly: { computePHash: jest.Mock; hammingDistance: jest.Mock };
  let mockTruthLog: { verifyChain: jest.Mock; appendEvent: jest.Mock };

  const mockModeration = {
    banUser: jest.fn(),
  } as unknown as ModerationService;

  const mockCrisisDetection = {
    analyzeContent: jest.fn(),
  } as unknown as CrisisDetectionService;

  const mockCrisisIntervention = {
    reportCrisis: jest.fn(),
  } as unknown as CrisisInterventionService;

  const mockHoneypot = {
    injectHoneypot: jest.fn(),
  } as unknown as HoneypotService;

  const mockContracts = {
    resolveContract: jest.fn(),
  } as unknown as ContractsService;

  const mockIdentityVerification = {
    completeMockVerification: jest.fn(),
  } as unknown as IdentityVerificationService;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockAnomaly = {
      computePHash: jest.fn().mockReturnValue("0000000000000000"),
      hammingDistance: jest.fn().mockReturnValue(10),
    };
    mockTruthLog = {
      verifyChain: jest.fn(),
      appendEvent: jest.fn().mockResolvedValue("evt-hash"),
    };
    controller = new AdminController(
      mockModeration,
      mockCrisisDetection,
      mockCrisisIntervention,
      mockHoneypot as any,
      mockContracts,
      {} as any,
      {} as any,
      mockAnomaly as unknown as AnomalyService,
      mockTruthLog as any,
      mockIdentityVerification,
      mockPool as unknown as Pool,
    );
    jest.clearAllMocks();
  });

  describe("injectHoneypot", () => {
    it("should delegate to HoneypotService and return status", async () => {
      (mockHoneypot.injectHoneypot as jest.Mock).mockResolvedValueOnce(
        undefined,
      );

      const result = await controller.injectHoneypot();

      expect(result).toEqual({ status: "honeypot_injected" });
      expect(mockHoneypot.injectHoneypot).toHaveBeenCalledTimes(1);
    });
  });

  describe("banUser", () => {
    it("should delegate to ModerationService with correct params", async () => {
      (mockModeration.banUser as jest.Mock).mockResolvedValueOnce({
        status: "USER_PERMANENTLY_BANNED",
        eventId: "evt-1",
      });

      const result = await controller.banUser(
        "target-user-1",
        { id: "ADMIN_root" },
        { reason: "Repeated fraud violations" },
      );

      expect(result).toEqual({
        status: "USER_PERMANENTLY_BANNED",
        eventId: "evt-1",
      });
      expect(mockModeration.banUser).toHaveBeenCalledWith(
        "ADMIN_root",
        "target-user-1",
        "Repeated fraud violations",
      );
      // AU11: privileged action is recorded in the tamper-evident audit log.
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        "ADMIN_USER_BANNED",
        expect.objectContaining({
          adminId: "ADMIN_root",
          targetUserId: "target-user-1",
        }),
      );
    });

    it("AU11: should reject an admin banning their own account (self-target guard)", async () => {
      await expect(
        controller.banUser(
          "ADMIN_root",
          { id: "ADMIN_root" },
          { reason: "oops" },
        ),
      ).rejects.toThrow(/own account/);
      expect(mockModeration.banUser).not.toHaveBeenCalled();
      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
    });

    it("should propagate ForbiddenException from ModerationService for non-admin", async () => {
      (mockModeration.banUser as jest.Mock).mockRejectedValueOnce(
        new Error("User non-admin lacks the required ADMIN role"),
      );

      await expect(
        controller.banUser(
          "target-user-1",
          { id: "non-admin" },
          { reason: "test" },
        ),
      ).rejects.toThrow(/ADMIN role/);
    });
  });

  describe("resolveContract", () => {
    it("should delegate to ContractsService and return result", async () => {
      (mockContracts.resolveContract as jest.Mock).mockResolvedValueOnce(
        undefined,
      );

      const result = await controller.resolveContract(
        "contract-1",
        { id: "ADMIN_root" },
        { outcome: "COMPLETED" },
      );

      expect(result).toEqual({
        status: "resolved",
        contractId: "contract-1",
        outcome: "COMPLETED",
      });
      expect(mockContracts.resolveContract).toHaveBeenCalledWith(
        "contract-1",
        "COMPLETED",
      );
      // AU11: admin override of a money-bearing resolution is audited.
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        "ADMIN_CONTRACT_RESOLVED",
        expect.objectContaining({
          adminId: "ADMIN_root",
          contractId: "contract-1",
          outcome: "COMPLETED",
        }),
      );
    });
  });

  describe("adjustIntegrity", () => {
    it("AU11: should adjust score and write an audit entry", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ integrity_score: 55 }] });

      const result = await controller.adjustIntegrity(
        "target-user-1",
        { id: "ADMIN_root" },
        { delta: 5, reason: "manual correction" },
      );

      expect(result).toEqual({
        status: "integrity_adjusted",
        userId: "target-user-1",
        delta: 5,
        reason: "manual correction",
      });
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        "ADMIN_INTEGRITY_ADJUSTED",
        expect.objectContaining({
          adminId: "ADMIN_root",
          targetUserId: "target-user-1",
          delta: 5,
          reason: "manual correction",
          newScore: 55,
        }),
      );
    });

    it("AU11: should reject an admin adjusting their own integrity score", async () => {
      await expect(
        controller.adjustIntegrity(
          "ADMIN_root",
          { id: "ADMIN_root" },
          { delta: 50, reason: "self" },
        ),
      ).rejects.toThrow(/own integrity score/);
      expect(mockPool.query).not.toHaveBeenCalled();
      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
    });
  });

  describe("getStats", () => {
    it("should return system statistics", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: "42" }] })
        .mockResolvedValueOnce({ rows: [{ count: "10" }] })
        .mockResolvedValueOnce({ rows: [{ count: "5" }] })
        .mockResolvedValueOnce({ rows: [{ avg: "67.5" }] })
        .mockResolvedValueOnce({ rows: [{ count: "3" }] });

      const result = await controller.getStats();

      expect(result).toEqual({
        totalUsers: 42,
        activeContracts: 10,
        pendingProofs: 5,
        avgIntegrity: 67.5,
        pendingDisputes: 3,
      });
    });
  });

  describe("completeIdentityVerificationForUser", () => {
    it("should delegate to IdentityVerificationService mock completion", async () => {
      (
        mockIdentityVerification.completeMockVerification as jest.Mock
      ).mockResolvedValueOnce({
        userId: "user-1",
        kycStatus: "VERIFIED",
        ageVerificationStatus: "VERIFIED",
      });

      const result = await controller.completeIdentityVerificationForUser(
        "user-1",
        {
          mode: "KYC_AND_AGE",
          status: "VERIFIED",
        },
      );

      expect(result).toEqual(
        expect.objectContaining({ userId: "user-1", kycStatus: "VERIFIED" }),
      );
      expect(
        mockIdentityVerification.completeMockVerification,
      ).toHaveBeenCalledWith({
        userId: "user-1",
        mode: "KYC_AND_AGE",
        status: "VERIFIED",
      });
    });
  });

  describe("scanHashCollisions", () => {
    it("should return empty collisions when no proofs have close hashes", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: "p1",
            user_id: "u1",
            contract_id: "c1",
            media_uri: "file://a.mp4",
            submitted_at: "2026-01-01",
          },
          {
            id: "p2",
            user_id: "u2",
            contract_id: "c2",
            media_uri: "file://b.mp4",
            submitted_at: "2026-01-02",
          },
        ],
      });
      mockAnomaly.computePHash
        .mockReturnValueOnce("aaaa")
        .mockReturnValueOnce("bbbb");
      mockAnomaly.hammingDistance.mockReturnValueOnce(30);

      const result = await controller.scanHashCollisions();

      expect(result.collisions).toHaveLength(0);
    });

    it("should detect collisions when hashes are within threshold", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: "p1",
            user_id: "u1",
            contract_id: "c1",
            media_uri: "file://a.mp4",
            submitted_at: "2026-01-01",
          },
          {
            id: "p2",
            user_id: "u2",
            contract_id: "c2",
            media_uri: "file://a-copy.mp4",
            submitted_at: "2026-01-02",
          },
        ],
      });
      mockAnomaly.computePHash
        .mockReturnValueOnce("aaaa")
        .mockReturnValueOnce("aaaa");
      mockAnomaly.hammingDistance.mockReturnValueOnce(0);

      const result = await controller.scanHashCollisions();

      expect(result.collisions).toHaveLength(1);
      expect(result.collisions[0].origin.id).toBe("p1");
      expect(result.collisions[0].duplicate.id).toBe("p2");
      // PRV15: distance 0 == identical URI → reported as an exact-match collision,
      // not a fabricated similarity percentage.
      expect(result.collisions[0].matchType).toBe("EXACT_URI");
      expect((result.collisions[0].origin as any).similarity).toBeUndefined();
    });
  });

  describe("getReconciliationVisibility", () => {
    it("should return reconciliation contracts, dispute side effects, and summary", async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: "c1", status: "RECONCILE_REQUIRED" }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "fx1",
              outcome: "DISPUTE_UPHELD",
              effect_type: "STRIPE_CAPTURE_APPEAL_FEE",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              contract_reconcile_required_count: 1,
              dispute_fee_side_effect_backlog_count: 1,
            },
          ],
        });

      const result = await controller.getReconciliationVisibility("25");

      expect(result.summary).toEqual({
        contract_reconcile_required_count: 1,
        dispute_fee_side_effect_backlog_count: 1,
      });
      expect(result.contracts).toHaveLength(1);
      expect(result.disputeFeeSideEffects).toHaveLength(1);
    });
  });

  describe("escalateCrisis", () => {
    it("should analyze content, log audit, and report crisis", async () => {
      (mockCrisisDetection.analyzeContent as jest.Mock).mockReturnValueOnce({
        isCrisis: true,
        severity: "CRITICAL",
        matchedKeywords: ["suicide"],
      });
      (mockCrisisIntervention.reportCrisis as jest.Mock).mockResolvedValueOnce({
        message: "logged",
        resources: [],
        actionTaken: "recorded",
        escalated: true,
      });

      const result = await controller.escalateCrisis(
        { userId: "user-1", trigger: "suicide" },
        { id: "ADMIN_root" },
      );

      expect(mockCrisisDetection.analyzeContent).toHaveBeenCalledWith(
        "suicide",
      );
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        "ADMIN_CRISIS_ESCALATED",
        expect.objectContaining({
          adminId: "ADMIN_root",
          targetUserId: "user-1",
        }),
      );
      expect(mockCrisisIntervention.reportCrisis).toHaveBeenCalledWith(
        "user-1",
        "suicide",
        expect.objectContaining({ severity: "CRITICAL" }),
      );
      expect(result.escalated).toBe(true);
    });

    it("should pass undefined detection when severity is NONE", async () => {
      (mockCrisisDetection.analyzeContent as jest.Mock).mockReturnValueOnce({
        isCrisis: false,
        severity: "NONE",
        matchedKeywords: [],
      });
      (mockCrisisIntervention.reportCrisis as jest.Mock).mockResolvedValueOnce({
        message: "logged",
        resources: [],
        actionTaken: "recorded",
        escalated: false,
      });

      await controller.escalateCrisis(
        { userId: "user-2", trigger: "off-platform concern" },
        { id: "ADMIN_root" },
      );

      expect(mockCrisisIntervention.reportCrisis).toHaveBeenCalledWith(
        "user-2",
        "off-platform concern",
        undefined,
      );
    });
  });
});
