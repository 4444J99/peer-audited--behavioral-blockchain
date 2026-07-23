import { CrisisInterventionService } from "./crisis-intervention.service";
import { Pool } from "pg";
import { CrisisNotificationService } from "./crisis-notification.service";

describe("CrisisInterventionService", () => {
  let service: CrisisInterventionService;
  let mockPool: { query: jest.Mock };
  let mockNotifications: {
    notifySafetyTeam: jest.Mock;
    scheduleFollowUp: jest.Mock;
  };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockNotifications = {
      notifySafetyTeam: jest.fn().mockResolvedValue({ id: "notif-1" }),
      scheduleFollowUp: jest.fn().mockResolvedValue({ id: "fu-1" }),
    };
    service = new CrisisInterventionService(
      mockPool as unknown as Pool,
      mockNotifications as unknown as CrisisNotificationService,
    );
  });

  describe("reportCrisis", () => {
    it("logs a crisis event and returns support resources", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "evt-1" }] });

      const result = await service.reportCrisis(
        "user-1",
        "I want to kill myself",
      );

      expect(result.message).toContain("not alone");
      expect(result.resources).toHaveLength(2);
      expect(result.resources[0].name).toBe("Crisis Text Line");
      expect(result.resources[1].name).toBe(
        "National Suicide Prevention Lifeline",
      );
      expect(result.actionTaken).toBe(
        "The incident has been recorded and is being reviewed.",
      );
      expect(result.escalated).toBe(false);
    });

    it("escalates CRITICAL severity", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "evt-2" }] });

      const result = await service.reportCrisis("user-1", "suicide", {
        isCrisis: true,
        severity: "CRITICAL",
        matchedKeywords: ["suicide"],
      });

      expect(result.escalated).toBe(true);
      expect(result.actionTaken).toContain("escalated to the safety team");
    });

    it("stores crisis event in database with correct severity", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "evt-3" }] });

      await service.reportCrisis("user-1", "I want to starve", {
        isCrisis: true,
        severity: "HIGH",
        matchedKeywords: ["starve"],
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO crisis_events"),
        ["user-1", "I want to starve", "HIGH", '["starve"]', false],
      );
    });

    it("defaults to HIGH severity when no detection result provided", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "evt-4" }] });

      const result = await service.reportCrisis("user-2", "manual trigger");

      expect(result.escalated).toBe(false);
    });

    it("passes matched keywords as JSON string", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "evt-5" }] });

      await service.reportCrisis("user-1", "test", {
        isCrisis: true,
        severity: "CRITICAL",
        matchedKeywords: ["kill myself", "suicide"],
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO crisis_events"),
        expect.arrayContaining(['["kill myself","suicide"]']),
      );
    });

    it("handles database errors gracefully", async () => {
      mockPool.query.mockRejectedValueOnce(new Error("DB connection lost"));

      await expect(service.reportCrisis("user-1", "test")).rejects.toThrow(
        "DB connection lost",
      );
    });

    it("stores escalated = true for CRITICAL with matched keywords", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "evt-6" }] });

      await service.reportCrisis("user-1", "end it all", {
        isCrisis: true,
        severity: "CRITICAL",
        matchedKeywords: ["end it all"],
      });

      const insertCall = mockPool.query.mock.calls[0];
      expect(insertCall[1][3]).toBe('["end it all"]');
      expect(insertCall[1][4]).toBe(true);
    });

    it("provides actionable instructions for each resource", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "evt-7" }] });

      const result = await service.reportCrisis("user-1", "test");

      for (const resource of result.resources) {
        expect(resource.contact).toBeDefined();
        expect(resource.instructions).toBeDefined();
      }
    });

    it("notifies safety team when detection is provided", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "evt-8" }] });

      await service.reportCrisis("user-1", "suicide", {
        isCrisis: true,
        severity: "CRITICAL",
        matchedKeywords: ["suicide"],
      });

      expect(mockNotifications.notifySafetyTeam).toHaveBeenCalledWith(
        "user-1",
        { isCrisis: true, severity: "CRITICAL", matchedKeywords: ["suicide"] },
        "SELF_REPORT",
        "suicide",
      );
    });

    it("schedules follow-up check-in when detection is provided", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "evt-9" }] });

      await service.reportCrisis("user-1", "I want to die", {
        isCrisis: true,
        severity: "CRITICAL",
        matchedKeywords: ["want to die"],
      });

      expect(mockNotifications.scheduleFollowUp).toHaveBeenCalledWith(
        "user-1",
        "evt-9",
        "CRITICAL",
      );
    });

    it("does not notify when detection is NONE", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "evt-10" }] });

      await service.reportCrisis("user-1", "hello world", {
        isCrisis: false,
        severity: "NONE",
        matchedKeywords: [],
      });

      expect(mockNotifications.notifySafetyTeam).not.toHaveBeenCalled();
      expect(mockNotifications.scheduleFollowUp).not.toHaveBeenCalled();
    });

    it("does not block crisis response if notification fails", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "evt-11" }] });
      mockNotifications.notifySafetyTeam.mockRejectedValueOnce(
        new Error("Webhook down"),
      );

      const result = await service.reportCrisis("user-1", "suicide", {
        isCrisis: true,
        severity: "CRITICAL",
        matchedKeywords: ["suicide"],
      });

      expect(result.escalated).toBe(true);
      expect(result.message).toContain("not alone");
    });

    it("passes source parameter to notification service", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "evt-12" }] });

      await service.reportCrisis(
        "user-1",
        "I want to end it all",
        {
          isCrisis: true,
          severity: "CRITICAL",
          matchedKeywords: ["end it all"],
        },
        "PROOF_DESCRIPTION",
      );

      expect(mockNotifications.notifySafetyTeam).toHaveBeenCalledWith(
        "user-1",
        expect.any(Object),
        "PROOF_DESCRIPTION",
        "I want to end it all",
      );
    });
  });
});
