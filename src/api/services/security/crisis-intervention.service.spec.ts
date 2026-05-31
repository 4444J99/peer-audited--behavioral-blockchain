import { CrisisInterventionService } from "./crisis-intervention.service";
import { Pool } from "pg";

describe("CrisisInterventionService", () => {
  let service: CrisisInterventionService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new CrisisInterventionService(mockPool as unknown as Pool);
  });

  describe("reportCrisis", () => {
    it("logs a crisis event and returns support resources", async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

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
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await service.reportCrisis("user-1", "suicide", {
        isCrisis: true,
        severity: "CRITICAL",
        matchedKeywords: ["suicide"],
      });

      expect(result.escalated).toBe(true);
    });

    it("stores crisis event in database with correct severity", async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

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
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await service.reportCrisis("user-2", "manual trigger");

      expect(result.escalated).toBe(false);
    });

    it("passes matched keywords as JSON string", async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

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
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

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
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await service.reportCrisis("user-1", "test");

      for (const resource of result.resources) {
        expect(resource.contact).toBeDefined();
        expect(resource.instructions).toBeDefined();
      }
    });
  });
});
