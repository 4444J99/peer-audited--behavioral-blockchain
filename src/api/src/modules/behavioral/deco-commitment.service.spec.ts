import { Test, TestingModule } from "@nestjs/testing";
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

  const sampleRequest = { url: "https://example.com/account", selector: "#status", expectedValue: "active" };

  it("createCommitment returns a commitment hash and persists it", async () => {
    const result = await service.createCommitment(sampleRequest, "user-1");
    expect(result.verified).toBe(true);
    expect(result.commitmentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.stored).toBe(true);
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });

  it("never persists the plaintext it commits to", async () => {
    const result = await service.createCommitment(sampleRequest, "user-1");
    const [sql, params] = mockPool.query.mock.calls[0];

    expect(sql).not.toMatch(/\bselector\b/);
    expect(sql).not.toMatch(/expected_value/);
    // Only the domain survives — never the path, selector, or committed value.
    expect(params).toEqual([
      "user-1",
      "example.com",
      result.timestamp,
      result.commitmentHash,
      true,
    ]);
    expect(params).not.toContain("#status");
    expect(params).not.toContain("active");
    expect(params).not.toContain("https://example.com/account");
  });

  it("stores a null domain when the url is unparseable", async () => {
    await service.createCommitment({ ...sampleRequest, url: "not a url" });
    expect(mockPool.query.mock.calls[0][1][1]).toBeNull();
  });

  it("verifyCommitment recomputes the hash and confirms a matching claim", async () => {
    const created = await service.createCommitment(sampleRequest);
    mockPool.query.mockResolvedValueOnce({
      rows: [{ committed_at: created.timestamp, created_at: new Date("2026-07-23") }],
    });

    const result = await service.verifyCommitment(created.commitmentHash, sampleRequest);

    expect(result.exists).toBe(true);
    expect(result.matches).toBe(true);
    expect(result.createdAt).toEqual(new Date("2026-07-23"));
  });

  it("rejects a claim that was altered after the commitment", async () => {
    const created = await service.createCommitment(sampleRequest);
    mockPool.query.mockResolvedValueOnce({
      rows: [{ committed_at: created.timestamp, created_at: new Date("2026-07-23") }],
    });

    const result = await service.verifyCommitment(created.commitmentHash, {
      ...sampleRequest,
      expectedValue: "inactive",
    });

    // Row presence alone must never count as proof.
    expect(result.exists).toBe(true);
    expect(result.matches).toBe(false);
  });

  it("reports existence without a verdict when no claim is supplied", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ committed_at: "2026-07-23T12:00:00.000Z", created_at: new Date("2026-07-23") }],
    });
    const result = await service.verifyCommitment("abc123");
    expect(result.exists).toBe(true);
    expect(result.matches).toBeNull();
  });

  it("verifyCommitment reports a nonexistent hash", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const result = await service.verifyCommitment("nonexistent", sampleRequest);
    expect(result.exists).toBe(false);
    expect(result.matches).toBeNull();
    expect(result.createdAt).toBeNull();
  });

  it("commitmentHash is deterministic for same inputs at the same instant", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-23T12:00:00Z"));
    const r1 = await service.createCommitment(sampleRequest);
    const r2 = await service.createCommitment(sampleRequest);
    expect(r1.commitmentHash).toBe(r2.commitmentHash);
    jest.useRealTimers();
  });
});
