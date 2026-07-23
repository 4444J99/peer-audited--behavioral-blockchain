import { BetaWaitlistController } from "./beta-waitlist.controller";
import { BetaWaitlistService } from "./beta-waitlist.service";

describe("BetaWaitlistController", () => {
  let controller: BetaWaitlistController;
  const signup = jest.fn();
  const confirm = jest.fn();
  const list = jest.fn();
  const stats = jest.fn();

  const mockService = {
    signup,
    confirm,
    list,
    stats,
  } as unknown as BetaWaitlistService;

  beforeEach(() => {
    [signup, confirm, list, stats].forEach((f) => f.mockReset());
    controller = new BetaWaitlistController(mockService);
  });

  it("delegates public signup to the service", async () => {
    signup.mockResolvedValue({ status: "pending", channel: "organic" });
    const result = await controller.join({ email: "user@example.com" } as any);
    expect(signup).toHaveBeenCalledWith({ email: "user@example.com" });
    expect(result).toMatchObject({ status: "pending", channel: "organic" });
  });

  it("returns a minimal confirmation payload (no token leak)", async () => {
    confirm.mockResolvedValue({
      status: "confirmed",
      email: "user@example.com",
      confirmedAt: new Date(),
    });
    const result = await controller.confirm("tok_abc");
    expect(confirm).toHaveBeenCalledWith("tok_abc");
    expect(result).toEqual({ status: "confirmed", email: "user@example.com" });
  });

  it("parses admin list filters and returns a count", async () => {
    list.mockResolvedValue([{ id: "1" }, { id: "2" }]);
    const result = await controller.list("organic", "pending", "50");
    expect(list).toHaveBeenCalledWith({
      channel: "organic",
      status: "pending",
      limit: 50,
    });
    expect(result.count).toBe(2);
  });

  it("exposes conversion stats for admins", async () => {
    stats.mockResolvedValue({ total: 3, confirmed: 1 });
    const result = await controller.stats();
    expect(result).toEqual({ total: 3, confirmed: 1 });
  });
});
