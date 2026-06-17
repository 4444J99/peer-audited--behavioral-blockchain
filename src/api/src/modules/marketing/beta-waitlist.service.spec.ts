import { Test, TestingModule } from "@nestjs/testing";
import { Pool } from "pg";
import { NotFoundException } from "@nestjs/common";
import { BetaWaitlistService } from "./beta-waitlist.service";
import {
  BETA_WAITLIST_NOTIFIER,
  BetaWaitlistNotifier,
} from "./beta-waitlist.notifier";

function makeRow(overrides: Record<string, any> = {}) {
  return {
    id: "bw1",
    email: "User@Example.com",
    email_normalized: "user@example.com",
    name: null,
    goal: null,
    platform: "ios",
    source: "direct",
    channel: "direct",
    intent: null,
    utm_source: null,
    utm_campaign: null,
    utm_medium: null,
    referrer: null,
    referral_code: null,
    status: "pending",
    confirmation_token: "tok_abc",
    confirmed_at: null,
    admitted_at: null,
    created_at: new Date(),
    inserted: true,
    ...overrides,
  };
}

describe("BetaWaitlistService", () => {
  let service: BetaWaitlistService;
  const mockQuery = jest.fn();
  const sendConfirmation = jest.fn();
  const notifier: BetaWaitlistNotifier = { sendConfirmation };

  beforeEach(async () => {
    mockQuery.mockReset();
    sendConfirmation.mockReset();
    sendConfirmation.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BetaWaitlistService,
        { provide: Pool, useValue: { query: mockQuery } },
        { provide: BETA_WAITLIST_NOTIFIER, useValue: notifier },
      ],
    }).compile();

    service = module.get<BetaWaitlistService>(BetaWaitlistService);
  });

  describe("signup", () => {
    it("captures source attribution and classifies the channel", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          makeRow({
            source: "do-not-text-tonight",
            channel: "organic",
            intent: "no-contact-urge",
            utm_source: "emergency_asset",
          }),
        ],
      });

      const result = await service.signup({
        email: "User@Example.com",
        source: "do-not-text-tonight",
        intent: "no-contact-urge",
        utm_source: "emergency_asset",
        utm_campaign: "do_not_text_your_ex_tonight",
      });

      // The INSERT must persist the classified channel + raw source.
      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain("user@example.com"); // normalized email for dedupe
      expect(params).toContain("do-not-text-tonight"); // raw source preserved
      expect(params).toContain("organic"); // derived channel

      expect(result.channel).toBe("organic");
      expect(result.status).toBe("pending");
      expect(result.isNew).toBe(true);
      expect(result.confirmation.url).toContain("/beta/confirm?token=");
    });

    it("sends a confirmation for a new pending signup (email delivery seam)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makeRow()] });

      await service.signup({ email: "user@example.com" });

      expect(sendConfirmation).toHaveBeenCalledTimes(1);
      expect(sendConfirmation.mock.calls[0][0]).toMatchObject({
        email: "User@Example.com",
        channel: "direct",
      });
    });

    it("is idempotent and does not re-confirm an already-confirmed email", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [makeRow({ status: "confirmed", inserted: false })],
      });

      const result = await service.signup({ email: "user@example.com" });

      expect(result.isNew).toBe(false);
      expect(result.alreadyConfirmed).toBe(true);
      expect(sendConfirmation).not.toHaveBeenCalled();
    });
  });

  describe("confirm", () => {
    it("transitions a pending entry to confirmed", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [makeRow({ status: "confirmed", confirmed_at: new Date() })],
      });

      const entry = await service.confirm("tok_abc");
      expect(entry.status).toBe("confirmed");
    });

    it("is idempotent for an already-confirmed token", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // UPDATE matched nothing
        .mockResolvedValueOnce({
          rows: [makeRow({ status: "confirmed" })],
        }); // SELECT finds existing

      const entry = await service.confirm("tok_abc");
      expect(entry.status).toBe("confirmed");
    });

    it("throws on an unknown token", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(service.confirm("nope")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("throws when no token is provided", async () => {
      await expect(service.confirm("")).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe("stats", () => {
    it("aggregates conversion by channel and status", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { channel: "organic", status: "pending", count: 3 },
          { channel: "organic", status: "confirmed", count: 2 },
          { channel: "referral", status: "confirmed", count: 5 },
        ],
      });

      const stats = await service.stats();
      expect(stats.total).toBe(10);
      expect(stats.confirmed).toBe(7);
      expect(stats.conversionRate).toBeCloseTo(0.7);
      expect(stats.byChannel).toEqual({ organic: 5, referral: 5 });
      expect(stats.byStatus).toEqual({ pending: 3, confirmed: 7 });
    });

    it("reports a zero conversion rate on an empty waitlist", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const stats = await service.stats();
      expect(stats.total).toBe(0);
      expect(stats.conversionRate).toBe(0);
    });
  });

  describe("list", () => {
    it("filters by channel and status and caps the limit", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makeRow()] });

      await service.list({ channel: "organic", status: "pending", limit: 50 });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("channel = $1");
      expect(sql).toContain("status = $2");
      expect(params).toEqual(["organic", "pending", 50]);
    });
  });
});
