import { Test, TestingModule } from "@nestjs/testing";
import { EnterpriseScopeService } from "./enterprise-scope.service";
import { Pool } from "pg";

describe("EnterpriseScopeService", () => {
  let service: EnterpriseScopeService;
  const mockQuery = jest.fn();

  beforeEach(async () => {
    mockQuery.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnterpriseScopeService,
        { provide: Pool, useValue: { query: mockQuery } },
      ],
    }).compile();

    service = module.get<EnterpriseScopeService>(EnterpriseScopeService);
  });

  describe("Scope Management", () => {
    it("returns scopes for an enterprise", async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: "s1",
            enterprise_id: "e1",
            scope_key: "contracts",
            limit_value: 100,
            current_usage: 10,
            reset_period: "monthly",
          },
        ],
      });
      const scopes = await service.getScopes("e1");
      expect(scopes).toHaveLength(1);
      expect(scopes[0].scopeKey).toBe("contracts");
    });

    it("allows action when no scope limit set", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const result = await service.checkScopeLimit("e1", "contracts");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it("denies action when scope limit exceeded", async () => {
      mockQuery.mockResolvedValue({
        rows: [{ limit_value: 10, current_usage: 10 }],
      });
      const result = await service.checkScopeLimit("e1", "contracts");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("records scope usage", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await expect(
        service.recordUsage("e1", "contracts", 5),
      ).resolves.not.toThrow();
    });
  });

  describe("Seat Management", () => {
    it("assigns a seat to a user", async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: "seat1",
            enterprise_id: "e1",
            user_id: "u1",
            seat_type: "MEMBER",
            active: true,
          },
        ],
      });
      const seat = await service.assignSeat("e1", "u1");
      expect(seat.seatType).toBe("MEMBER");
      expect(seat.active).toBe(true);
    });

    it("gets seats for an enterprise", async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: "seat1",
            enterprise_id: "e1",
            user_id: "u1",
            seat_type: "MEMBER",
            active: true,
          },
          {
            id: "seat2",
            enterprise_id: "e1",
            user_id: "u2",
            seat_type: "ADMIN",
            active: true,
          },
        ],
      });
      const seats = await service.getSeats("e1");
      expect(seats).toHaveLength(2);
    });
  });
});
