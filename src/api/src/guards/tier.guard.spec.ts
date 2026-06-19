import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { AccessTier, TierGuard } from "./tier.guard";

describe("TierGuard", () => {
  let guard: TierGuard;
  let mockPool: { query: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    guard = new TierGuard(mockPool as any);
  });

  function createContext(
    user?: { id?: string } | null,
    body?: Record<string, unknown>,
  ) {
    const hasUser = user !== null && user !== undefined;
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: hasUser ? user : undefined,
          body,
        }),
      }),
    } as any;
  }

  it("denies when no authenticated user is present", async () => {
    await expect(guard.canActivate(createContext(null))).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it("denies when the authenticated user has no id", async () => {
    await expect(guard.canActivate(createContext({}))).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it("denies when the user row is missing", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await expect(
      guard.canActivate(createContext({ id: "ghost" }, { stakeAmount: 0 })),
    ).rejects.toThrow(/not found/);
  });

  it("allows pro users without active-contract or escrow caps", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ access_tier: AccessTier.PRO }],
    });

    await expect(
      guard.canActivate(createContext({ id: "user-1" }, { stakeAmount: 500 })),
    ).resolves.toBe(true);

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    expect(mockPool.query).toHaveBeenCalledWith(
      "SELECT access_tier FROM users WHERE id = $1",
      ["user-1"],
    );
  });

  it("denies free-tier users from creating contracts", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ access_tier: AccessTier.FREE }],
    });

    await expect(
      guard.canActivate(createContext({ id: "user-1" }, { stakeAmount: 0 })),
    ).rejects.toThrow(/requires early access or pro/);
  });

  it("denies early-access users when requested stake is greater than $0", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ access_tier: AccessTier.EARLY_ACCESS }],
    });

    await expect(
      guard.canActivate(createContext({ id: "user-1" }, { stakeAmount: 1 })),
    ).rejects.toThrow(/limited to \$0 escrow/);
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });

  it("treats MVP_39 pricing as a positive escrow request for early-access users", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ access_tier: AccessTier.EARLY_ACCESS }],
    });

    await expect(
      guard.canActivate(
        createContext(
          { id: "user-1" },
          { stakeAmount: 0, pricing: { plan: "MVP_39" } },
        ),
      ),
    ).rejects.toThrow(/limited to \$0 escrow/);
  });

  it("denies early-access users at the active-contract cap", async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{ access_tier: AccessTier.EARLY_ACCESS }],
      })
      .mockResolvedValueOnce({ rows: [{ count: 3 }] });

    await expect(
      guard.canActivate(createContext({ id: "user-1" }, { stakeAmount: 0 })),
    ).rejects.toThrow(/limited to 3 active contracts/);

    expect(mockPool.query).toHaveBeenNthCalledWith(
      2,
      `SELECT COUNT(*)::int AS count
       FROM contracts
       WHERE user_id = $1
         AND status = 'ACTIVE'`,
      ["user-1"],
    );
  });

  it("allows early-access users below the active-contract cap with $0 escrow", async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{ access_tier: AccessTier.EARLY_ACCESS }],
      })
      .mockResolvedValueOnce({ rows: [{ count: 2 }] });

    await expect(
      guard.canActivate(createContext({ id: "user-1" }, { stakeAmount: 0 })),
    ).resolves.toBe(true);
  });

  it("denies unrecognized access tiers", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ access_tier: "enterprise" }],
    });

    await expect(
      guard.canActivate(createContext({ id: "user-1" }, { stakeAmount: 0 })),
    ).rejects.toThrow(/not recognized/);
  });

  it("surfaces malformed stake amounts before applying early-access caps", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ access_tier: AccessTier.EARLY_ACCESS }],
    });

    await expect(
      guard.canActivate(
        createContext({ id: "user-1" }, { stakeAmount: "not-a-number" }),
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
