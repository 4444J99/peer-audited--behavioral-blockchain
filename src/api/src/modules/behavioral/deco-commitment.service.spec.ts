import { Test, TestingModule } from "@nestjs/testing";
import { Pool } from "pg";
import { DecoCommitmentService } from "./deco-commitment.service";

describe("DecoCommitmentService", () => {
  let service: DecoCommitmentService;
  let mockPool: { query: jest.Mock };

  beforeEach(async () => {
    mockPool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecoCommitmentService,
        { provide: "DATABASE_POOL", useValue: mockPool },
      ],
    }).compile();
    service = module.get<DecoCommitmentService>(DecoCommitmentService);
  });

  const sampleRequest = { url: "https://example.com", selector: "#status", expectedValue: "active" };

  it("createCommitment stores and returns result with commitmentHash", async () => {
    const result = await service.createCommitment(sampleRequest, "user-1");
    expect(result.verified).toBe(true);
    expect(result.commitmentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.stored).toBe(true);
    expect(mockPool.query).toHaveBeenCalledTimes(1);
    expect(mockPool.query.mock.calls[0][1]).toEqual([
      "user-1",
      "https://example.com",
      "#status",
      "active",
      result.commitmentHash,
      true,
    ]);
  });

  it("verifyCommitment returns original claim for existing hash", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ url: "https://example.com", selector: "#status", expected_value: "active", created_at: new Date("2026-07-23") }],
    });
    const result = await service.verifyCommitment("abc123");
    expect(result.exists).toBe(true);
    expect(result.originalClaim).toEqual({ url: "https://example.com", selector: "#status", expectedValue: "active" });
    expect(result.createdAt).toEqual(new Date("2026-07-23"));
  });

  it("verifyCommitment returns null for nonexistent hash", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const result = await service.verifyCommitment("nonexistent");
    expect(result.exists).toBe(false);
    expect(result.originalClaim).toBeNull();
    expect(result.createdAt).toBeNull();
  });

  it("commitmentHash is deterministic for same inputs", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-23T12:00:00Z"));
    const r1 = await service.createCommitment(sampleRequest);
    const r2 = await service.createCommitment(sampleRequest);
    expect(r1.commitmentHash).toBe(r2.commitmentHash);
    jest.useRealTimers();
  });
});
