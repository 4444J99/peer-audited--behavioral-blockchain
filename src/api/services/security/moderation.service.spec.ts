import { ModerationService } from "./moderation.service";
import { TruthLogService } from "../ledger/truth-log.service";
import { ForbiddenException, BadRequestException } from "@nestjs/common";
import { Pool } from "pg";

describe("ModerationService", () => {
  let modService: ModerationService;

  const mockTruthLog = {
    appendEvent: jest.fn(),
  } as unknown as TruthLogService;

  const mockPool = {
    query: jest.fn(),
  } as unknown as Pool;

  beforeEach(() => {
    modService = new ModerationService(mockTruthLog, mockPool);
    jest.clearAllMocks();
  });

  describe("banUser", () => {
    it("should verify admin role via DB, log ACCOUNT_BANNED event, and update user status", async () => {
      // Mock: admin role lookup returns ADMIN
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ role: "ADMIN" }] }) // admin role check
        .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE users SET status = 'BANNED'

      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValueOnce(
        "evt-ban-123",
      );

      const result = await modService.banUser(
        "admin-uuid-001",
        "user_cheater",
        "Failed 3 audits",
      );

      expect(result.status).toBe("USER_PERMANENTLY_BANNED");
      expect(result.eventId).toBe("evt-ban-123");

      // Verify admin role was checked via DB
      const roleCheckCall = (mockPool.query as jest.Mock).mock.calls[0];
      expect(roleCheckCall[0]).toContain("SELECT role FROM users");
      expect(roleCheckCall[1]).toEqual(["admin-uuid-001"]);

      // Verify truth log was called
      const appendCall = (mockTruthLog.appendEvent as jest.Mock).mock.calls[0];
      expect(appendCall[0]).toBe("ACCOUNT_BANNED");
      expect(appendCall[1].targetUserId).toBe("user_cheater");
      expect(appendCall[1].executedBy).toBe("admin-uuid-001");
      expect(appendCall[1].action).toBe("PERMANENT_EXILE");

      // Verify user status was updated to BANNED
      const statusUpdateCall = (mockPool.query as jest.Mock).mock.calls[1];
      expect(statusUpdateCall[0]).toContain("status = 'BANNED'");
      expect(statusUpdateCall[1]).toEqual(["user_cheater"]);
    });

    it("should throw ForbiddenException if user has no ADMIN role in DB", async () => {
      // Must set up mock for each banUser call since each consumes one mock return
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ role: "USER" }] }) // first call
        .mockResolvedValueOnce({ rows: [{ role: "USER" }] }); // second call

      await expect(
        modService.banUser(
          "regular-user-uuid",
          "user_cheater",
          "I do not like them",
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        modService.banUser(
          "regular-user-uuid",
          "user_cheater",
          "I do not like them",
        ),
      ).rejects.toThrow(/lacks the required 'ADMIN' role/);

      // Asserts that the TruthLog was never touched
      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException if admin user not found in DB", async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(
        modService.banUser("nonexistent-uuid", "user_cheater", "N/A"),
      ).rejects.toThrow(ForbiddenException);

      expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
    });
  });

  describe("autoFilter", () => {
    it("returns empty array for clean text", () => {
      expect(
        modService.autoFilter("This is a normal proof submission"),
      ).toEqual([]);
    });

    it("detects critical keywords", () => {
      const matches = modService.autoFilter(
        "This contains violence and weapon references",
      );
      expect(matches).toContain("violence");
      expect(matches).toContain("weapon");
    });

    it("detects medium keywords", () => {
      const matches = modService.autoFilter(
        "This is hate speech with harassment",
      );
      expect(matches).toContain("hate");
      expect(matches).toContain("harassment");
    });

    it("is case-insensitive", () => {
      const matches = modService.autoFilter("VIOLENCE in uppercase");
      expect(matches).toContain("violence");
    });

    it("detects multiple severity levels", () => {
      const matches = modService.autoFilter("spam and violence");
      expect(matches).toContain("spam");
      expect(matches).toContain("violence");
    });
  });

  describe("flagContent", () => {
    it("flags content and logs to truth log", async () => {
      const mockFlag = {
        id: "flag-001",
        content_type: "PROOF_MEDIA",
        content_id: "proof-123",
        severity: "HIGH",
        status: "PENDING",
      };
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockFlag] });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValueOnce(
        "evt-flag-001",
      );

      const result = await modService.flagContent(
        "PROOF_MEDIA",
        "proof-123",
        "Inappropriate content",
        {
          reporterId: "auditor-001",
          details: "Contains nudity",
        },
      );

      expect(result.id).toBe("flag-001");
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith(
        "CONTENT_FLAGGED",
        expect.objectContaining({
          contentType: "PROOF_MEDIA",
          contentId: "proof-123",
        }),
      );
    });

    it("assigns severity from auto-filter matches", async () => {
      const mockFlag = { id: "flag-002", severity: "CRITICAL" };
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockFlag] });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValueOnce(
        "evt-flag-002",
      );

      await modService.flagContent("PROOF_MEDIA", "proof-456", "Auto-filter", {
        autoFlagged: true,
        autoFilterMatches: ["violence", "spam"],
      });

      const insertCall = (mockPool.query as jest.Mock).mock.calls[0];
      expect(insertCall[1][5]).toBe("CRITICAL"); // severity parameter
    });
  });

  describe("scanAndFlag", () => {
    it("returns null for clean content", async () => {
      const result = await modService.scanAndFlag(
        "PROOF_MEDIA",
        "proof-001",
        "Normal weigh-in photo",
      );
      expect(result).toBeNull();
    });

    it("flags content with matching keywords", async () => {
      const mockFlag = { id: "flag-003", severity: "CRITICAL" };
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockFlag] });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValueOnce(
        "evt-flag-003",
      );

      const result = await modService.scanAndFlag(
        "PROOF_MEDIA",
        "proof-002",
        "This shows violence",
      );
      expect(result).not.toBeNull();
      expect(result!.id).toBe("flag-003");
    });
  });

  describe("getQueue", () => {
    it("returns all flags when no status filter", async () => {
      const mockFlags = [{ id: "flag-001" }, { id: "flag-002" }];
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockFlags });

      const result = await modService.getQueue();
      expect(result).toHaveLength(2);
    });

    it("filters by status", async () => {
      const mockFlags = [{ id: "flag-001", status: "PENDING" }];
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockFlags });

      const result = await modService.getQueue("PENDING");
      expect(result).toHaveLength(1);
    });
  });

  describe("reviewContent", () => {
    it("allows admin to approve content", async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ role: "ADMIN" }] }) // admin check
        .mockResolvedValueOnce({
          rows: [{ id: "flag-001", status: "APPROVED" }],
        }); // update
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValueOnce(
        "evt-review-001",
      );

      const result = await modService.reviewContent(
        "admin-001",
        "flag-001",
        "APPROVED",
        "Content is fine",
      );
      expect(result.status).toBe("APPROVED");
    });

    it("allows admin to remove content", async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ role: "ADMIN" }] })
        .mockResolvedValueOnce({
          rows: [{ id: "flag-001", status: "REMOVED" }],
        });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValueOnce(
        "evt-review-002",
      );

      const result = await modService.reviewContent(
        "admin-001",
        "flag-001",
        "REMOVED",
        "Violates policy",
      );
      expect(result.status).toBe("REMOVED");
    });

    it("rejects non-admin reviewers", async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ role: "USER" }],
      });

      await expect(
        modService.reviewContent(
          "user-001",
          "flag-001",
          "APPROVED",
          "Looks fine",
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("throws if flag not found", async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ role: "ADMIN" }] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        modService.reviewContent("admin-001", "nonexistent", "APPROVED", "N/A"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("appealContent", () => {
    it("allows user to appeal a reviewed decision", async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: "flag-001", status: "REMOVED" }],
        }) // lookup
        .mockResolvedValueOnce({
          rows: [{ id: "flag-001", appeal_status: "PENDING" }],
        }); // update
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValueOnce(
        "evt-appeal-001",
      );

      const result = await modService.appealContent(
        "flag-001",
        "user-001",
        "This was a legitimate proof",
      );
      expect(result.appeal_status).toBe("PENDING");
    });

    it("rejects appeal for pending (unreviewed) content", async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: "flag-001", status: "PENDING" }],
      });

      await expect(
        modService.appealContent("flag-001", "user-001", "Please reconsider"),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws if flag not found", async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(
        modService.appealContent("nonexistent", "user-001", "N/A"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("resolveAppeal", () => {
    it("upholds appeal (keeps removal)", async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ role: "ADMIN" }] }) // admin check
        .mockResolvedValueOnce({
          rows: [
            { id: "flag-001", appeal_status: "UPHELD", status: "REMOVED" },
          ],
        });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValueOnce(
        "evt-resolve-001",
      );

      const result = await modService.resolveAppeal(
        "admin-001",
        "flag-001",
        "UPHELD",
        "Content violates policy",
      );
      expect(result.appeal_status).toBe("UPHELD");
      expect(result.status).toBe("REMOVED");
    });

    it("overturns appeal (restores content)", async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ role: "ADMIN" }] })
        .mockResolvedValueOnce({
          rows: [
            { id: "flag-001", appeal_status: "OVERTURNED", status: "APPROVED" },
          ],
        });
      (mockTruthLog.appendEvent as jest.Mock).mockResolvedValueOnce(
        "evt-resolve-002",
      );

      const result = await modService.resolveAppeal(
        "admin-001",
        "flag-001",
        "OVERTURNED",
        "Was legitimate proof",
      );
      expect(result.appeal_status).toBe("OVERTURNED");
      expect(result.status).toBe("APPROVED");
    });

    it("rejects non-admin resolvers", async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ role: "USER" }],
      });

      await expect(
        modService.resolveAppeal("user-001", "flag-001", "UPHELD", "N/A"),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
