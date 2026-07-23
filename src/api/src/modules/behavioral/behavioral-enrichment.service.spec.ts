import { Test, TestingModule } from "@nestjs/testing";
import { Pool } from "pg";
import { BehavioralEnrichmentService } from "./behavioral-enrichment.service";

describe("BehavioralEnrichmentService", () => {
  let service: BehavioralEnrichmentService;
  let mockPool: { query: jest.Mock };

  beforeEach(async () => {
    mockPool = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BehavioralEnrichmentService,
        { provide: Pool, useValue: mockPool },
      ],
    }).compile();
    service = module.get<BehavioralEnrichmentService>(BehavioralEnrichmentService);
  });

  it("getBboRecommendations returns entries", () => {
    const recs = service.getBboRecommendations("physical");
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]).toHaveProperty("id");
    expect(recs[0]).toHaveProperty("title");
  });

  it("getMicroReward returns positive amounts", () => {
    const reward = service.getMicroReward();
    expect(reward.base).toBeGreaterThan(0);
    expect(reward.total).toBeGreaterThanOrEqual(reward.base);
  });

  it("getCmReward escalates over days", () => {
    expect(service.getCmReward(1)).toBe(25);
    expect(service.getCmReward(10)).toBe(50);
    expect(service.getCmReward(20)).toBe(100);
    expect(service.getCmReward(25)).toBe(150);
  });

  it("getExitInterviewQuestions returns different sets for success vs failure", () => {
    const success = service.getExitInterviewQuestions("COMPLETED");
    const failure = service.getExitInterviewQuestions("FAILED");
    expect(success.length).toBeGreaterThan(0);
    expect(failure.length).toBeGreaterThan(0);
    expect(success[0].id).toBe("satisfaction");
    expect(failure.some((q: any) => q.id === "why_failed")).toBe(true);
  });

  it("checkGatewayOathEligibility rejects non-first contracts", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ count: 1 }] });
    const result = await service.checkGatewayOathEligibility("user-1", 100, 7);
    expect(result.allowed).toBe(false);
  });

  it("checkGatewayOathEligibility accepts fresh users", async () => {
    mockPool.query.mockResolvedValue({ rows: [{ count: 0 }] });
    const result = await service.checkGatewayOathEligibility("user-1", 100, 7);
    expect(result.allowed).toBe(true);
  });
});
