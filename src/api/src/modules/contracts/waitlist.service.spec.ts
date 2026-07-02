import { Test, TestingModule } from "@nestjs/testing";
import { WaitlistService } from "./waitlist.service";
import { Pool } from "pg";
import { ConflictException } from "@nestjs/common";
import { EmailService } from "../email/email.service";

describe("WaitlistService", () => {
  let service: WaitlistService;
  let pool: Pool;
  const mockQuery = jest.fn();
  const mockEmail = {
    sendEarlyAccessOnboarding: jest.fn(),
  };

  beforeEach(async () => {
    mockQuery.mockReset();
    mockEmail.sendEarlyAccessOnboarding.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitlistService,
        { provide: Pool, useValue: { query: mockQuery } },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();

    service = module.get<WaitlistService>(WaitlistService);
    pool = module.get<Pool>(Pool);
  });

  it("joins waitlist", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ next_position: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "w1",
            user_id: "u1",
            cohort_id: "c1",
            pod_id: null,
            display_alias: null,
            position: 1,
            enrolled: false,
            enrolled_at: null,
            created_at: new Date(),
            was_inserted: true,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ email: "[email redacted]" }],
      });

    const result = await service.joinWaitlist("u1", "c1");
    expect(result.position).toBe(1);
    expect(result.cohortId).toBe("c1");
    expect(mockEmail.sendEarlyAccessOnboarding).toHaveBeenCalledWith({
      to: "[email redacted]",
      userId: "u1",
      cohortId: "c1",
      position: 1,
      trigger: "waitlist_join",
    });
  });

  it("does not resend onboarding when the upsert updates an existing entry", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ next_position: 2 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "w1",
            user_id: "u1",
            cohort_id: "c1",
            pod_id: "p2",
            display_alias: null,
            position: 1,
            enrolled: false,
            enrolled_at: null,
            created_at: new Date(),
            was_inserted: false,
          },
        ],
      });

    await service.joinWaitlist("u1", "c1", "p2");

    expect(mockEmail.sendEarlyAccessOnboarding).not.toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("rejects already-enrolled entries when the upsert returns no row", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ next_position: 2 }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(service.joinWaitlist("u1", "c1")).rejects.toThrow(
      ConflictException,
    );
    expect(mockEmail.sendEarlyAccessOnboarding).not.toHaveBeenCalled();
  });

  it("gets waitlist position", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: "w1",
          user_id: "u1",
          cohort_id: "c1",
          pod_id: null,
          display_alias: null,
          position: 3,
          enrolled: false,
          enrolled_at: null,
          created_at: new Date(),
        },
      ],
    });

    const result = await service.getWaitlistPosition("u1", "c1");
    expect(result?.position).toBe(3);
  });

  it("returns null for unknown user/cohort", async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const result = await service.getWaitlistPosition("u1", "nx");
    expect(result).toBeNull();
  });

  it("gets cohort waitlist count", async () => {
    mockQuery.mockResolvedValue({ rows: [{ total: "5" }] });
    const result = await service.getWaitlistCount("c1");
    expect(result).toBe(5);
  });

  it("promotes from waitlist", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: "w1",
          user_id: "u1",
          cohort_id: "c1",
          pod_id: null,
          display_alias: null,
          position: 1,
          enrolled: true,
          enrolled_at: new Date(),
          created_at: new Date(),
        },
        {
          id: "w2",
          user_id: "u2",
          cohort_id: "c1",
          pod_id: null,
          display_alias: null,
          position: 2,
          enrolled: true,
          enrolled_at: new Date(),
          created_at: new Date(),
        },
      ],
    });

    const results = await service.promoteFromWaitlist("c1", 2);
    expect(results).toHaveLength(2);
    results.forEach((r) => expect(r.enrolled).toBe(true));
  });
});
