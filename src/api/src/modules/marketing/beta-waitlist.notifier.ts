import { Injectable, Logger } from "@nestjs/common";

export interface BetaWaitlistConfirmation {
  email: string;
  name: string | null;
  channel: string;
  confirmationUrl: string;
}

export const BETA_WAITLIST_NOTIFIER = "BETA_WAITLIST_NOTIFIER";

/**
 * Delivery seam for the waitlist confirmation step. Phase 1 has no transactional
 * email provider wired, so the default implementation records the confirmation
 * and the API returns a queue-confirmation response as the source of truth (the
 * issue explicitly allows "confirmation email OR equivalent confirmation flow").
 * A real provider (Resend / SES / Postmark) drops in behind this interface
 * without touching the service or controller.
 */
export interface BetaWaitlistNotifier {
  sendConfirmation(payload: BetaWaitlistConfirmation): Promise<void>;
}

@Injectable()
export class LoggingBetaWaitlistNotifier implements BetaWaitlistNotifier {
  private readonly logger = new Logger("BetaWaitlistNotifier");

  async sendConfirmation(payload: BetaWaitlistConfirmation): Promise<void> {
    this.logger.log(
      `Beta-waitlist confirmation queued for ${payload.email} via ${payload.channel} -> ${payload.confirmationUrl}`,
    );
  }
}
