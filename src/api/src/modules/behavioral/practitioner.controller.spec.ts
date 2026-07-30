import "reflect-metadata";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { PractitionerController } from "./practitioner.controller";
import { PractitionerIntelligenceService } from "./practitioner-intelligence.service";
import { ROLES_KEY } from "../../common/guards/role.guard";

describe("PractitionerController", () => {
  let controller: PractitionerController;
  let pool: { query: jest.Mock };

  const mockIntelligence = {
    getPractitionerDashboard: jest.fn(),
    getClientRiskProfile: jest.fn(),
    getRiskTrend: jest.fn(),
    analyzeJournalEntry: jest.fn(),
    sendPractitionerAlert: jest.fn(),
    calculateAdherenceRate: jest.fn(),
  } as unknown as PractitionerIntelligenceService;

  // Shaped like a real request: AuthGuard sets req.user; req.id is a correlation ID.
  const req = { id: "req-correlation-id", user: { id: "prac-001" } };

  const grantAssignment = () =>
    pool.query.mockResolvedValueOnce({ rows: [{ "?column?": 1 }], rowCount: 1 });
  const denyAssignment = () =>
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

  beforeEach(() => {
    pool = { query: jest.fn() };
    controller = new PractitionerController(mockIntelligence, pool as any);
    jest.clearAllMocks();
  });

  describe("dashboard", () => {
    it("returns the dashboard scoped to the requesting practitioner", async () => {
      const dashboards = [{ clientId: "client-1", clientAlias: "Kestrel" }];
      (mockIntelligence.getPractitionerDashboard as jest.Mock).mockResolvedValue(dashboards);

      const result = await controller.dashboard(req);
      expect(result).toEqual(dashboards);
      expect(mockIntelligence.getPractitionerDashboard).toHaveBeenCalledWith("prac-001");
    });
  });

  describe("riskProfile", () => {
    it("returns the risk profile for an assigned client", async () => {
      grantAssignment();
      const profile = { userId: "client-1", riskScore: 42, riskLevel: "YELLOW" };
      (mockIntelligence.getClientRiskProfile as jest.Mock).mockResolvedValue(profile);

      const result = await controller.riskProfile(req, "client-1");
      expect(result).toEqual(profile);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("practitioner_client_assignments"),
        ["prac-001", "client-1"],
      );
    });

    it("rejects an unassigned client for a non-admin practitioner", async () => {
      denyAssignment();
      pool.query.mockResolvedValueOnce({ rows: [{ role: "PRACTITIONER" }], rowCount: 1 });

      await expect(controller.riskProfile(req, "client-x")).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockIntelligence.getClientRiskProfile).not.toHaveBeenCalled();
    });

    it("allows an ADMIN (verified against the DB) to view any client", async () => {
      denyAssignment();
      pool.query.mockResolvedValueOnce({ rows: [{ role: "ADMIN" }], rowCount: 1 });
      (mockIntelligence.getClientRiskProfile as jest.Mock).mockResolvedValue({
        userId: "client-x",
      });

      const result = await controller.riskProfile(req, "client-x");
      expect(result).toEqual({ userId: "client-x" });
    });

    it("fails closed when the requesting user row is missing", async () => {
      denyAssignment();
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(controller.riskProfile(req, "client-x")).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("riskTrend", () => {
    it("clamps the days window to 1..90 and defaults to 30", async () => {
      (mockIntelligence.getRiskTrend as jest.Mock).mockResolvedValue([]);

      grantAssignment();
      await controller.riskTrend(req, "client-1", "500");
      expect(mockIntelligence.getRiskTrend).toHaveBeenLastCalledWith("client-1", 90);

      grantAssignment();
      await controller.riskTrend(req, "client-1", "not-a-number");
      expect(mockIntelligence.getRiskTrend).toHaveBeenLastCalledWith("client-1", 30);

      grantAssignment();
      const result = await controller.riskTrend(req, "client-1", "14");
      expect(mockIntelligence.getRiskTrend).toHaveBeenLastCalledWith("client-1", 14);
      expect(result).toEqual({ clientId: "client-1", days: 14, trend: [] });
    });
  });

  describe("alerts", () => {
    it("returns mapped alerts for an assigned client", async () => {
      grantAssignment();
      const createdAt = new Date("2026-07-01T12:00:00Z");
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: "alert-1",
            user_id: "client-1",
            alert_type: "CRISIS_LANGUAGE",
            excerpt: "self harm",
            severity: "HIGH",
            created_at: createdAt.toISOString(),
          },
        ],
        rowCount: 1,
      });

      const result = await controller.alerts(req, "client-1", undefined);
      expect(result.clientId).toBe("client-1");
      expect(result.alerts).toEqual([
        {
          id: "alert-1",
          userId: "client-1",
          alertType: "CRISIS_LANGUAGE",
          excerpt: "self harm",
          severity: "HIGH",
          createdAt,
        },
      ]);
      // default limit of 20 flows into the query
      expect(pool.query).toHaveBeenLastCalledWith(
        expect.stringContaining("FROM practitioner_alerts"),
        ["client-1", 20],
      );
    });

    it("clamps an oversized limit to 100", async () => {
      grantAssignment();
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await controller.alerts(req, "client-1", "9999");
      expect(pool.query).toHaveBeenLastCalledWith(
        expect.stringContaining("FROM practitioner_alerts"),
        ["client-1", 100],
      );
    });
  });

  describe("scanJournalEntry", () => {
    it("analyzes the entry and persists every resulting alert", async () => {
      grantAssignment();
      const alerts = [
        {
          id: "a-1",
          userId: "client-1",
          alertType: "DISTRESS_ESCALATION",
          excerpt: "breaking point",
          severity: "HIGH",
          createdAt: new Date(),
        },
        {
          id: "a-2",
          userId: "client-1",
          alertType: "RATIONALIZATION",
          excerpt: "just this once",
          severity: "MEDIUM",
          createdAt: new Date(),
        },
      ];
      (mockIntelligence.analyzeJournalEntry as jest.Mock).mockResolvedValue(alerts);
      (mockIntelligence.sendPractitionerAlert as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.scanJournalEntry(req, "client-1", {
        entryText: "I hit a breaking point, but just this once I can slip",
      });

      expect(mockIntelligence.analyzeJournalEntry).toHaveBeenCalledWith(
        "client-1",
        "I hit a breaking point, but just this once I can slip",
      );
      expect(mockIntelligence.sendPractitionerAlert).toHaveBeenCalledTimes(2);
      expect(mockIntelligence.sendPractitionerAlert).toHaveBeenCalledWith(
        "prac-001",
        "client-1",
        alerts[0],
      );
      expect(result).toEqual({ clientId: "client-1", alerts, persisted: 2 });
    });

    it("persists nothing for a clean entry", async () => {
      grantAssignment();
      (mockIntelligence.analyzeJournalEntry as jest.Mock).mockResolvedValue([]);

      const result = await controller.scanJournalEntry(req, "client-1", {
        entryText: "Had a calm, steady day today.",
      });
      expect(mockIntelligence.sendPractitionerAlert).not.toHaveBeenCalled();
      expect(result.persisted).toBe(0);
    });

    it("rejects a missing entryText before touching the DB", async () => {
      await expect(
        controller.scanJournalEntry(req, "client-1", { entryText: "" }),
      ).rejects.toThrow(BadRequestException);
      expect(pool.query).not.toHaveBeenCalled();
      expect(mockIntelligence.analyzeJournalEntry).not.toHaveBeenCalled();
    });
  });

  describe("adherence", () => {
    it("resolves the active contract and returns the adherence rate", async () => {
      grantAssignment();
      pool.query.mockResolvedValueOnce({ rows: [{ id: "contract-7" }], rowCount: 1 });
      (mockIntelligence.calculateAdherenceRate as jest.Mock).mockResolvedValue(85);

      const result = await controller.adherence(req, "client-1");
      expect(mockIntelligence.calculateAdherenceRate).toHaveBeenCalledWith(
        "client-1",
        "contract-7",
      );
      expect(result).toEqual({
        clientId: "client-1",
        contractId: "contract-7",
        adherenceRate: 85,
      });
    });

    it("returns a null contract when the client has no active contract", async () => {
      grantAssignment();
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      (mockIntelligence.calculateAdherenceRate as jest.Mock).mockResolvedValue(0);

      const result = await controller.adherence(req, "client-1");
      expect(mockIntelligence.calculateAdherenceRate).toHaveBeenCalledWith("client-1", "");
      expect(result).toEqual({ clientId: "client-1", contractId: null, adherenceRate: 0 });
    });
  });

  describe("role metadata", () => {
    it("restricts the whole controller to PRACTITIONER and ADMIN roles", () => {
      const roles = Reflect.getMetadata(ROLES_KEY, PractitionerController);
      expect(roles).toEqual(["PRACTITIONER", "ADMIN"]);
    });
  });
});
