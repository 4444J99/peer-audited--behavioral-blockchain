import { Injectable, Logger } from "@nestjs/common";

type EarlyAccessTrigger = "waitlist_join" | "tier_upgrade";
type EmailMode = "mock" | "sendgrid";

export interface EarlyAccessOnboardingEmailInput {
  to: string | null | undefined;
  userId?: string;
  cohortId?: string;
  position?: number;
  trigger: EarlyAccessTrigger;
}

export interface EmailSendResult {
  accepted: boolean;
  mode: EmailMode;
  providerMessageId?: string | null;
  reason?: string;
}

interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
  templateId: string | null;
  dynamicTemplateData: Record<string, unknown>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sendGridUrl = "https://api.sendgrid.com/v3/mail/send";

  async sendEarlyAccessOnboarding(
    input: EarlyAccessOnboardingEmailInput,
  ): Promise<EmailSendResult> {
    if (!input.to) {
      return { accepted: false, mode: "mock", reason: "missing_recipient" };
    }

    const rendered = this.renderEarlyAccessOnboarding(input);
    return this.send({
      to: input.to,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      templateId: rendered.templateId,
      dynamicTemplateData: rendered.dynamicTemplateData,
      category: "early-access-onboarding",
    });
  }

  private async send(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
    templateId: string | null;
    dynamicTemplateData: Record<string, unknown>;
    category: string;
  }): Promise<EmailSendResult> {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail =
      process.env.SENDGRID_FROM_EMAIL || process.env.STYX_EMAIL_FROM;

    if (!apiKey || !fromEmail) {
      this.logger.log(
        `Mock email ${input.category} queued for ${this.maskEmail(input.to)}`,
      );
      return {
        accepted: true,
        mode: "mock",
        reason: !apiKey ? "sendgrid_api_key_missing" : "from_email_missing",
      };
    }

    const personalization: Record<string, unknown> = {
      to: [{ email: input.to }],
    };
    if (input.templateId) {
      personalization.dynamic_template_data = input.dynamicTemplateData;
    }

    const payload: Record<string, unknown> = {
      personalizations: [personalization],
      from: { email: fromEmail },
      categories: [input.category],
    };

    if (input.templateId) {
      payload.template_id = input.templateId;
    } else {
      payload.subject = input.subject;
      payload.content = [
        { type: "text/plain", value: input.text },
        { type: "text/html", value: input.html },
      ];
    }

    const response = await fetch(this.sendGridUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `SendGrid email send failed with ${response.status}${body ? `: ${body}` : ""}`,
      );
    }

    return {
      accepted: true,
      mode: "sendgrid",
      providerMessageId: response.headers.get("x-message-id"),
    };
  }

  private renderEarlyAccessOnboarding(
    input: EarlyAccessOnboardingEmailInput,
  ): RenderedEmail {
    const webUrl =
      process.env.STYX_WEB_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_WEB_URL ||
      "https://styx.app";
    const ctaUrl = `${webUrl.replace(/\/$/, "")}/dashboard`;
    const templateId =
      process.env.SENDGRID_EARLY_ACCESS_ONBOARDING_TEMPLATE_ID ||
      process.env.STYX_EARLY_ACCESS_ONBOARDING_TEMPLATE_ID ||
      null;
    const triggerLabel =
      input.trigger === "tier_upgrade" ? "tier upgrade" : "waitlist join";
    const subject = "Your Styx early access is ready";
    const text = [
      "Welcome to Styx early access.",
      "",
      "Your private beta account is ready for onboarding. Open the app to finish setup, review safety controls, and create your first commitment.",
      "",
      ctaUrl,
    ].join("\n");
    const html = [
      "<p>Welcome to Styx early access.</p>",
      "<p>Your private beta account is ready for onboarding. Open the app to finish setup, review safety controls, and create your first commitment.</p>",
      `<p><a href="${ctaUrl}">Open Styx</a></p>`,
    ].join("");

    return {
      subject,
      text,
      html,
      templateId,
      dynamicTemplateData: {
        subject,
        ctaUrl,
        userId: input.userId ?? null,
        cohortId: input.cohortId ?? null,
        waitlistPosition: input.position ?? null,
        trigger: input.trigger,
        triggerLabel,
      },
    };
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!local || !domain) {
      return "unknown";
    }
    return `${local.slice(0, 1)}***@${domain}`;
  }
}
