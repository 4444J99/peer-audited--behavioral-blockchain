import { Test, TestingModule } from "@nestjs/testing";
import { Pool } from "pg";
import { BadRequestException } from "@nestjs/common";
import { BehavioralController } from "./behavioral.controller";
import { BehavioralEnhancementsService } from "./behavioral-enhancements.service";

describe("BehavioralController", () => {
  let controller: BehavioralController;
  let service: BehavioralEnhancementsService;
  let pool: { query: jest.Mock };

  const mockQuery = jest.fn();
  const user = { id: "user-001" };

  beforeEach(async () => {
    mockQuery.mockReset();
    pool = { query: mockQuery };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BehavioralController],
      providers: [
        BehavioralEnhancementsService,
        { provide: Pool, useValue: pool },
      ],
    }).compile();

    controller = module.get<BehavioralController>(BehavioralController);
    service = module.get<BehavioralEnhancementsService>(
      BehavioralEnhancementsService,
    );
  });

  describe("subscribe", () => {
    it("persists a subscription and returns subscribed=true (H1 fix)", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "sub-1", status: "ACTIVE" }],
      });
      const result = await controller.subscribe(user, "cd-001");
      expect(result).toEqual({ subscribed: true });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO commitment_device_subscriptions"),
        ["user-001", "cd-001"],
      );
    });

    it("rejects an unknown device id with BadRequestException", async () => {
      await expect(
        controller.subscribe(user, "device-not-in-catalog"),
      ).rejects.toThrow(BadRequestException);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe("unsubscribe", () => {
    it("returns subscribed=false when no row was cancelled (still subscribed)", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });
      const result = await controller.unsubscribe(user, "cd-001");
      expect(result).toEqual({ subscribed: true });
    });

    it("returns subscribed=false when the row was actually cancelled", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });
      const result = await controller.unsubscribe(user, "cd-001");
      expect(result).toEqual({ subscribed: false });
    });
  });

  describe("proposeSwap", () => {
    it("throws NotFoundException when the source contract is missing (H2 fix)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(
        controller.proposeSwap(user, {
          sourceContractId: "c-missing",
          targetOathCategory: "BIOLOGICAL_WEIGHT",
          carryOverPct: 50,
        }),
      ).rejects.toThrow(/not found/i);
    });

    it("throws BadRequestException when stake_amount is NULL (H2 fix)", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ age_days: 30, status: "ACTIVE", stake_amount: null }],
      });
      await expect(
        controller.proposeSwap(user, {
          sourceContractId: "c-no-stake",
          targetOathCategory: "BIOLOGICAL_WEIGHT",
          carryOverPct: 50,
        }),
      ).rejects.toThrow(/stake_amount/);
    });
  });
});
