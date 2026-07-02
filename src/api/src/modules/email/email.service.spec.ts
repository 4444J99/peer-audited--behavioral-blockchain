import { EmailService } from "./email.service";

describe("EmailService", () => {
  let service: EmailService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_FROM_EMAIL;
    delete process.env.STYX_EMAIL_FROM;
    delete process.env.SENDGRID_EARLY_ACCESS_ONBOARDING_TEMPLATE_ID;
    delete process.env.STYX_WEB_PUBLIC_URL;
    service = new EmailService();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("uses the mock sender when SendGrid is not configured", async () => {
    const result = await service.sendEarlyAccessOnboarding({
      to: "early@styx.app",
      userId: "user-1",
      cohortId: "cohort-1",
      position: 7,
      trigger: "waitlist_join",
    });

    expect(result).toEqual({
      accepted: true,
      mode: "mock",
      reason: "sendgrid_api_key_missing",
    });
  });

  it("sends the early-access template through SendGrid when configured", async () => {
    process.env.SENDGRID_API_KEY = "SG.test";
    process.env.SENDGRID_FROM_EMAIL = "hello@styx.app";
    process.env.SENDGRID_EARLY_ACCESS_ONBOARDING_TEMPLATE_ID = "d-template";
    process.env.STYX_WEB_PUBLIC_URL = "https://app.styx.test";
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 202,
      headers: { get: jest.fn().mockReturnValue("msg-1") },
      text: jest.fn(),
    } as any);

    const result = await service.sendEarlyAccessOnboarding({
      to: "early@styx.app",
      userId: "user-1",
      trigger: "tier_upgrade",
    });

    expect(result).toEqual({
      accepted: true,
      mode: "sendgrid",
      providerMessageId: "msg-1",
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/mail/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer SG.test",
        }),
      }),
    );
    const body = JSON.parse(String((fetchSpy.mock.calls[0][1] as any).body));
    expect(body).toMatchObject({
      from: { email: "hello@styx.app" },
      template_id: "d-template",
      categories: ["early-access-onboarding"],
    });
    expect(body.personalizations[0].dynamic_template_data).toMatchObject({
      ctaUrl: "https://app.styx.test/dashboard",
      trigger: "tier_upgrade",
    });
  });
});
