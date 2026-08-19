import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { RetentionController } from "./retention.controller";
import { NotificationComposerService } from "../notifications/notification-composer.service";

describe("RetentionController", () => {
  let controller: RetentionController;
  let pool: { query: jest.Mock };
  let dashboard: { getDashboardSummary: jest.Mock };
  let endowed: { getProgressState: jest.Mock; applyDynamicDownscaling: jest.Mock };
  let danger: { evaluateDangerWindows: jest.Mock; getProtectionRecommendations: jest.Mock };
  let partners: {
    requestPartnerMatch: jest.Mock;
    scheduleCheckIn: jest.Mock;
    completeCheckIn: jest.Mock;
    getActivePartnerships: jest.Mock;
    getCheckInHistory: jest.Mock;
  };
  let notifications: { create: jest.Mock };

  // Shaped like a real request: AuthGuard sets req.user; req.id is a correlation ID.
  const req = { id: "req-correlation-id", user: { id: "user-001" } };

  beforeEach(() => {
    pool = { query: jest.fn() };
    dashboard = { getDashboardSummary: jest.fn() };
    endowed = { getProgressState: jest.fn(), applyDynamicDownscaling: jest.fn() };
    danger = { evaluateDangerWindows: jest.fn(), getProtectionRecommendations: jest.fn() };
    partners = {
      requestPartnerMatch: jest.fn(),
      scheduleCheckIn: jest.fn(),
      completeCheckIn: jest.fn(),
      getActivePartnerships: jest.fn(),
      getCheckInHistory: jest.fn(),
    };
    notifications = { create: jest.fn().mockResolvedValue({}) };

    controller = new RetentionController(
      pool as any,
      dashboard as any,
      endowed as any,
      danger as any,
      partners as any,
      new NotificationComposerService(),
      notifications as any,
    );
  });

  describe("getProgressDashboard", () => {
    it("returns the dashboard summary for an owned contract", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: "user-001" }] });
      const summary = { streak: { currentStreak: 4 }, daysRemaining: 10 };
      dashboard.getDashboardSummary.mockResolvedValueOnce(summary);

      const result = await controller.getProgressDashboard(req, "c-1");

      expect(result).toEqual(summary);
      expect(dashboard.getDashboardSummary).toHaveBeenCalledWith("user-001", "c-1");
    });

    it("throws NotFoundException for a missing contract", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await expect(controller.getProgressDashboard(req, "c-missing")).rejects.toThrow(
        NotFoundException,
      );
      expect(dashboard.getDashboardSummary).not.toHaveBeenCalled();
    });

    it("throws ForbiddenException for a contract owned by another user", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: "user-999" }] });
      await expect(controller.getProgressDashboard(req, "c-2")).rejects.toThrow(
        ForbiddenException,
      );
      expect(dashboard.getDashboardSummary).not.toHaveBeenCalled();
    });
  });

  describe("getEndowedProgress", () => {
    it("merges progress state with the dynamic downscaling result", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: "user-001" }] });
      endowed.getProgressState.mockResolvedValueOnce({
        contractId: "c-1",
        realProgress: 0.4,
        endowedBoost: 0.05,
        displayProgress: 0.45,
        currentTier: "Momentum",
        nextTierAt: 0.5,
        motivation: "The hardest part is over. Keep building.",
      });
      endowed.applyDynamicDownscaling.mockResolvedValueOnce({
        multiplier: 0.9,
        reason: "1 prior violation(s)",
      });

      const result = await controller.getEndowedProgress(req, "c-1");

      expect(result.currentTier).toBe("Momentum");
      expect(result.downscaling).toEqual({ multiplier: 0.9, reason: "1 prior violation(s)" });
      expect(endowed.getProgressState).toHaveBeenCalledWith("c-1");
      expect(endowed.applyDynamicDownscaling).toHaveBeenCalledWith("c-1");
    });

    it("enforces ownership before computing state", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: "someone-else" }] });
      await expect(controller.getEndowedProgress(req, "c-1")).rejects.toThrow(ForbiddenException);
      expect(endowed.getProgressState).not.toHaveBeenCalled();
    });
  });

  describe("getDangerZoneStatus", () => {
    it("evaluates every active contract in the user's timezone", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: "c-1" }, { id: "c-2" }] })
        .mockResolvedValueOnce({ rows: [{ timezone: "America/Chicago" }] });
      danger.evaluateDangerWindows
        .mockResolvedValueOnce([{ type: "DAY_3", severity: "HIGH", message: "m" }])
        .mockResolvedValueOnce([]);
      danger.getProtectionRecommendations
        .mockResolvedValueOnce([{ type: "DAY_3", action: "a", description: "d" }])
        .mockResolvedValueOnce([]);

      const result = await controller.getDangerZoneStatus(req);

      expect(result.timezone).toBe("America/Chicago");
      expect(result.inDangerZone).toBe(true);
      expect(result.contracts).toHaveLength(2);
      expect(result.contracts[0]).toEqual({
        contractId: "c-1",
        inDangerZone: true,
        windows: [{ type: "DAY_3", severity: "HIGH", message: "m" }],
        recommendations: [{ type: "DAY_3", action: "a", description: "d" }],
      });
      expect(result.contracts[1].inDangerZone).toBe(false);
      expect(danger.evaluateDangerWindows).toHaveBeenCalledWith("c-1", "America/Chicago");
      expect(danger.evaluateDangerWindows).toHaveBeenCalledWith("c-2", "America/Chicago");
    });

    it("returns an empty status when the user has no active contracts", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await controller.getDangerZoneStatus(req);

      expect(result.inDangerZone).toBe(false);
      expect(result.contracts).toEqual([]);
      // Missing users row falls back to the default timezone.
      expect(result.timezone).toBe("America/New_York");
    });
  });

  describe("invitePartner", () => {
    it("requests a partner match with the caller's categories", async () => {
      const match = {
        partnerId: "user-abc",
        alias: "alpha",
        sharedCategories: ["SUBSTANCE_USE"],
        mutualInterestScore: 1,
      };
      partners.requestPartnerMatch.mockResolvedValueOnce(match);

      const result = await controller.invitePartner(req, { categories: ["SUBSTANCE_USE"] });

      expect(result).toEqual(match);
      expect(partners.requestPartnerMatch).toHaveBeenCalledWith("user-001", ["SUBSTANCE_USE"]);
    });

    it.each([
      [undefined],
      [[]],
      ["SUBSTANCE_USE"],
      [[42]],
      [["  "]],
    ])("rejects invalid categories payload %p", async (categories) => {
      await expect(controller.invitePartner(req, { categories } as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(partners.requestPartnerMatch).not.toHaveBeenCalled();
    });
  });

  describe("acceptPartnership", () => {
    it("schedules the first check-in with the accepting user as partner", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: "user-owner", status: "ACTIVE" }] });
      const checkIn = { id: "chk-1", contractId: "c-1", partnerId: "user-001" };
      partners.scheduleCheckIn.mockResolvedValueOnce(checkIn);

      const result = await controller.acceptPartnership(req, { contractId: "c-1" });

      expect(result).toEqual(checkIn);
      expect(partners.scheduleCheckIn).toHaveBeenCalledWith("c-1", "user-001", "SCHEDULED");
    });

    it("rejects a missing contractId", async () => {
      await expect(controller.acceptPartnership(req, {})).rejects.toThrow(BadRequestException);
    });

    it("throws NotFoundException for an unknown contract", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await expect(controller.acceptPartnership(req, { contractId: "c-x" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("rejects partnering on your own contract", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: "user-001", status: "ACTIVE" }] });
      await expect(controller.acceptPartnership(req, { contractId: "c-own" })).rejects.toThrow(
        BadRequestException,
      );
      expect(partners.scheduleCheckIn).not.toHaveBeenCalled();
    });

    it("rejects non-active contracts", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: "user-owner", status: "COMPLETED" }] });
      await expect(controller.acceptPartnership(req, { contractId: "c-done" })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("listPartners", () => {
    it("returns the caller's active partnerships", async () => {
      const partnerships = [
        { partnerId: "p1", alias: "buddy", sharedCategories: [], mutualInterestScore: 1 },
      ];
      partners.getActivePartnerships.mockResolvedValueOnce(partnerships);

      const result = await controller.listPartners(req);

      expect(result).toEqual(partnerships);
      expect(partners.getActivePartnerships).toHaveBeenCalledWith("user-001");
    });
  });

  describe("getCheckInHistory", () => {
    it("returns history for the contract owner with the default limit", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ owner_id: "user-001", is_partner: false }] });
      partners.getCheckInHistory.mockResolvedValueOnce([{ id: "chk-1" }]);

      const result = await controller.getCheckInHistory(req, "c-1", undefined);

      expect(result).toEqual([{ id: "chk-1" }]);
      expect(partners.getCheckInHistory).toHaveBeenCalledWith("c-1", 20);
    });

    it("allows the partner of record to read history with a custom limit", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ owner_id: "user-999", is_partner: true }] });
      partners.getCheckInHistory.mockResolvedValueOnce([]);

      await controller.getCheckInHistory(req, "c-1", "5");

      expect(partners.getCheckInHistory).toHaveBeenCalledWith("c-1", 5);
    });

    it("rejects non-participants", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ owner_id: "user-999", is_partner: false }] });
      await expect(controller.getCheckInHistory(req, "c-1", undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("throws NotFoundException for an unknown contract", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await expect(controller.getCheckInHistory(req, "c-x", undefined)).rejects.toThrow(
        NotFoundException,
      );
    });

    it.each([["0"], ["101"], ["abc"]])("rejects invalid limit %p", async (limit) => {
      pool.query.mockResolvedValueOnce({ rows: [{ owner_id: "user-001", is_partner: false }] });
      await expect(controller.getCheckInHistory(req, "c-1", limit)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("completeCheckIn", () => {
    const membershipRow = {
      partner_id: "user-partner",
      owner_id: "user-001",
      owner_alias: "owner-o",
      partner_alias: "partner-p",
    };

    it("completes the check-in and notifies the counterpart", async () => {
      pool.query.mockResolvedValueOnce({ rows: [membershipRow] });
      const completed = { id: "chk-1", contractId: "c-1", partnerId: "user-partner", status: "COMPLETED" };
      partners.completeCheckIn.mockResolvedValueOnce(completed);

      const result = await controller.completeCheckIn(req, {
        checkInId: "chk-1",
        message: "All good",
      });

      expect(result).toEqual(completed);
      expect(partners.completeCheckIn).toHaveBeenCalledWith("chk-1", "All good");
      // Owner completed → the partner receives the composed PARTNER_CHECK_IN.
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-partner",
          type: "PARTNER_CHECK_IN",
          body: "owner-o sent you a check-in",
        }),
      );
    });

    it("lets the partner complete and notifies the owner with the partner's alias", async () => {
      const partnerReq = { user: { id: "user-partner" } };
      pool.query.mockResolvedValueOnce({ rows: [membershipRow] });
      partners.completeCheckIn.mockResolvedValueOnce({
        id: "chk-1",
        contractId: "c-1",
        partnerId: "user-partner",
        status: "COMPLETED",
      });

      await controller.completeCheckIn(partnerReq, { checkInId: "chk-1", message: "hi" });

      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-001",
          body: "partner-p sent you a check-in",
        }),
      );
    });

    it("does not fail the request when the counterpart notification errors", async () => {
      pool.query.mockResolvedValueOnce({ rows: [membershipRow] });
      partners.completeCheckIn.mockResolvedValueOnce({
        id: "chk-1",
        contractId: "c-1",
        partnerId: "user-partner",
        status: "COMPLETED",
      });
      notifications.create.mockRejectedValueOnce(new Error("push down"));

      const result = await controller.completeCheckIn(req, {
        checkInId: "chk-1",
        message: "still fine",
      });

      expect(result.status).toBe("COMPLETED");
    });

    it("rejects callers who are neither owner nor partner", async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ ...membershipRow, owner_id: "user-888", partner_id: "user-999" }],
      });
      await expect(
        controller.completeCheckIn(req, { checkInId: "chk-1", message: "nope" }),
      ).rejects.toThrow(ForbiddenException);
      expect(partners.completeCheckIn).not.toHaveBeenCalled();
    });

    it("throws NotFoundException for an unknown check-in", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      await expect(
        controller.completeCheckIn(req, { checkInId: "chk-x", message: "m" }),
      ).rejects.toThrow(NotFoundException);
    });

    it.each([
      [{ message: "m" }],
      [{ checkInId: "chk-1" }],
      [{ checkInId: "chk-1", message: "   " }],
    ])("rejects invalid payload %p", async (body) => {
      await expect(controller.completeCheckIn(req, body as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
