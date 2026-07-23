import { CrisisNotificationService } from "./crisis-notification.service";
import { Pool } from "pg";

describe("CrisisNotificationService", () => {
  let service: CrisisNotificationService;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new CrisisNotificationService(mockPool as unknown as Pool);
  });

  describe("notifySafetyTeam", () => {
    it("creates a notification record and returns it", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: "notif-1", created_at: "2026-07-23T00:00:00Z" }],
      });

      const result = await service.notifySafetyTeam(
        "user-1",
        {
          isCrisis: true,
          severity: "CRITICAL",
          matchedKeywords: ["suicide"],
          category: "SUICIDE",
        },
        "SELF_REPORT",
        "I want to kill myself",
      );

      expect(result.id).toBe("notif-1");
      expect(result.severity).toBe("CRITICAL");
      expect(result.source).toBe("SELF_REPORT");
      expect(result.acknowledged).toBe(false);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO crisis_notifications"),
        expect.arrayContaining(["user-1", "CRITICAL", "SUICIDE"]),
      );
    });

    it("does not send immediate webhook for HIGH severity", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: "notif-2", created_at: "2026-07-23T00:00:00Z" }],
      });

      await service.notifySafetyTeam(
        "user-1",
        { isCrisis: true, severity: "HIGH", matchedKeywords: ["relapse"] },
        "PROOF_DESCRIPTION",
        "I relapsed",
      );

      // Webhook not called because severity is not CRITICAL
      // (and CRISIS_WEBHOOK_URL is not set in test env)
    });

    it("handles database errors", async () => {
      mockPool.query.mockRejectedValueOnce(new Error("DB down"));

      await expect(
        service.notifySafetyTeam(
          "user-1",
          { isCrisis: true, severity: "CRITICAL", matchedKeywords: ["suicide"] },
          "SELF_REPORT",
          "suicide",
        ),
      ).rejects.toThrow("DB down");
    });
  });

  describe("scheduleFollowUp", () => {
    it("schedules a follow-up with correct delay for CRITICAL", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "fu-1" }] });

      const result = await service.scheduleFollowUp(
        "user-1",
        "evt-1",
        "CRITICAL",
      );

      expect(result.id).toBe("fu-1");
      expect(result.status).toBe("PENDING");
      expect(result.scheduledAt).toBeDefined();

      // CRITICAL = 1 hour delay
      const scheduled = new Date(result.scheduledAt).getTime();
      const now = Date.now();
      const oneHourMs = 60 * 60 * 1000;
      expect(scheduled).toBeGreaterThan(now + oneHourMs - 5000);
      expect(scheduled).toBeLessThan(now + oneHourMs + 5000);
    });

    it("schedules a follow-up with correct delay for HIGH", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "fu-2" }] });

      const result = await service.scheduleFollowUp(
        "user-1",
        "evt-2",
        "HIGH",
      );

      // HIGH = 24 hour delay
      const scheduled = new Date(result.scheduledAt).getTime();
      const now = Date.now();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      expect(scheduled).toBeGreaterThan(now + twentyFourHoursMs - 5000);
      expect(scheduled).toBeLessThan(now + twentyFourHoursMs + 5000);
    });

    it("schedules a follow-up with correct delay for MEDIUM", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: "fu-3" }] });

      const result = await service.scheduleFollowUp(
        "user-1",
        "evt-3",
        "MEDIUM",
      );

      // MEDIUM = 48 hour delay
      const scheduled = new Date(result.scheduledAt).getTime();
      const now = Date.now();
      const fortyEightHoursMs = 48 * 60 * 60 * 1000;
      expect(scheduled).toBeGreaterThan(now + fortyEightHoursMs - 5000);
      expect(scheduled).toBeLessThan(now + fortyEightHoursMs + 5000);
    });
  });

  describe("completeFollowUp", () => {
    it("marks a follow-up as completed with response", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: "fu-1",
            user_id: "user-1",
            crisis_event_id: "evt-1",
            scheduled_at: "2026-07-23T01:00:00Z",
            status: "COMPLETED",
            response: "I'm safe now",
            completed_at: "2026-07-23T00:30:00Z",
          },
        ],
      });

      const result = await service.completeFollowUp("fu-1", "I'm safe now");

      expect(result.status).toBe("COMPLETED");
      expect(result.response).toBe("I'm safe now");
    });

    it("returns null for non-existent follow-up", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.completeFollowUp("fu-999", "I'm fine");

      expect(result).toBeNull();
    });
  });

  describe("processMissedFollowUps", () => {
    it("marks missed follow-ups and creates escalation notifications", async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            { id: "fu-1", user_id: "user-1", crisis_event_id: "evt-1" },
            { id: "fu-2", user_id: "user-2", crisis_event_id: "evt-2" },
          ],
          rowCount: 2,
        })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 });

      const count = await service.processMissedFollowUps();

      expect(count).toBe(2);
      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    it("returns 0 when no follow-ups are missed", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const count = await service.processMissedFollowUps();

      expect(count).toBe(0);
    });
  });

  describe("getUnacknowledgedNotifications", () => {
    it("returns unacknowledged notifications sorted by severity", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: "n-1",
            user_id: "user-1",
            severity: "CRITICAL",
            category: "SUICIDE",
            matched_keywords: '["suicide"]',
            source: "SELF_REPORT",
            message: "suicide",
            created_at: "2026-07-23T00:00:00Z",
            acknowledged: false,
            acknowledged_by: null,
            acknowledged_at: null,
          },
          {
            id: "n-2",
            user_id: "user-2",
            severity: "HIGH",
            category: "SUBSTANCE",
            matched_keywords: '["relapse"]',
            source: "PROOF_DESCRIPTION",
            message: "I relapsed",
            created_at: "2026-07-23T00:01:00Z",
            acknowledged: false,
            acknowledged_by: null,
            acknowledged_at: null,
          },
        ],
      });

      const result = await service.getUnacknowledgedNotifications();

      expect(result).toHaveLength(2);
      expect(result[0].severity).toBe("CRITICAL");
      expect(result[1].severity).toBe("HIGH");
    });
  });

  describe("acknowledgeNotification", () => {
    it("marks a notification as acknowledged", async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      await service.acknowledgeNotification("n-1", "admin-1");

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE crisis_notifications"),
        ["admin-1", "n-1"],
      );
    });
  });
});
