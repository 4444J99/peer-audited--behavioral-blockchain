import { Pool } from "pg";
import { BillingService } from "../b2b/billing.service";
import { MeteredUsageService } from "./metered-usage.service";

describe("MeteredUsageService", () => {
  let service: MeteredUsageService;
  let pool: { query: jest.Mock };
  let billing: { recordUsage: jest.Mock };

  beforeEach(() => {
    pool = { query: jest.fn() };
    billing = { recordUsage: jest.fn().mockResolvedValue(undefined) };
    service = new MeteredUsageService(
      pool as unknown as Pool,
      billing as unknown as BillingService,
    );
  });

  const mockUserEnterprise = (enterpriseId: string | null) =>
    pool.query.mockResolvedValueOnce({
      rows: enterpriseId ? [{ enterprise_id: enterpriseId }] : [{}],
    });

  const mockInsert = (inserted: boolean) =>
    pool.query.mockResolvedValueOnce({ rowCount: inserted ? 1 : 0 });

  it("persists a usage_event and forwards to Stripe billing for an enterprise user", async () => {
    mockUserEnterprise("ent-001");
    mockInsert(true);

    await service.recordMeteredUsage("user-1", "proof_accepted", "contract-9");

    expect(pool.query.mock.calls[1][0]).toContain("INSERT INTO usage_event");
    expect(pool.query.mock.calls[1][1]).toEqual([
      "user-1",
      "ent-001",
      "proof_accepted",
      1,
      "contract-9",
    ]);
    expect(billing.recordUsage).toHaveBeenCalledWith(
      "ent-001",
      "proof_accepted",
      1,
      "contract-9",
    );
  });

  it("persists but does not forward to billing for a user without an enterprise", async () => {
    mockUserEnterprise(null);
    mockInsert(true);

    await service.recordMeteredUsage("user-1", "proof_accepted", "contract-9");

    expect(pool.query.mock.calls[1][1][1]).toBeNull();
    expect(billing.recordUsage).not.toHaveBeenCalled();
  });

  it("skips duplicate billing when a stable event id already exists", async () => {
    mockUserEnterprise("ent-001");
    mockInsert(false);

    await service.recordMeteredUsage("user-1", "proof_accepted", "contract-9");

    expect(billing.recordUsage).not.toHaveBeenCalled();
  });

  it("does not fail the caller when Stripe forwarding throws after persistence", async () => {
    mockUserEnterprise("ent-001");
    mockInsert(true);
    billing.recordUsage.mockRejectedValueOnce(new Error("stripe down"));

    await expect(
      service.recordMeteredUsage("user-1", "proof_accepted", "contract-9"),
    ).resolves.toBeUndefined();
  });
});
