import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PushTokensService, PendingReceiptDelivery } from './push-tokens.service';
import { ExpoPushProvider } from './expo-push.provider';
import { PushReceipt } from './push-provider.interface';

const RECEIPT_BATCH_LIMIT = 500;

// Expo needs time to hand a notification to APNs/FCM and hear back; polling
// sooner reliably returns nothing.
const RECEIPT_MIN_AGE_SECONDS = 300;

// Receipts stop being retrievable after roughly 24 hours. At a 5-minute cadence
// and a 5-minute floor, 24 attempts covers a couple of hours of transient
// unavailability without polling a ticket that is already unrecoverable.
const RECEIPT_MAX_ATTEMPTS = 24;

/** The one receipt error that means the device will never accept a push again. */
const DEVICE_GONE_CODE = 'DeviceNotRegistered';

/**
 * Phase two of push delivery.
 *
 * A send returns a ticket — "accepted", not "delivered". The device-level
 * verdict (DeviceNotRegistered, MessageTooBig, MessageRateExceeded, …) is only
 * ever reported by /push/getReceipts, keyed on that ticket id. Without this
 * sweep a dead device keeps its token forever and every push to it is recorded
 * as a success.
 */
@Injectable()
export class PushReceiptsScheduler {
  private readonly logger = new Logger(PushReceiptsScheduler.name);

  constructor(
    private readonly pushTokens: PushTokensService,
    private readonly provider: ExpoPushProvider,
  ) {}

  @Cron('0 */5 * * * *')
  async collectPushReceipts(): Promise<void> {
    let pending: PendingReceiptDelivery[];
    try {
      pending = await this.pushTokens.getDeliveriesAwaitingReceipt(
        RECEIPT_BATCH_LIMIT,
        RECEIPT_MIN_AGE_SECONDS,
      );
    } catch (err) {
      this.logger.error(
        `Receipt sweep: failed to load pending deliveries: ${err instanceof Error ? err.message : err}`,
      );
      return;
    }

    if (pending.length === 0) return;

    let receipts: Map<string, PushReceipt>;
    try {
      receipts = await this.provider.fetchReceipts(
        pending.map((delivery) => delivery.provider_ticket_id),
      );
    } catch (err) {
      this.logger.error(
        `Receipt sweep: provider lookup failed: ${err instanceof Error ? err.message : err}`,
      );
      return;
    }

    let confirmed = 0;
    let failed = 0;
    let deactivated = 0;
    let unresolved = 0;
    let abandoned = 0;

    for (const delivery of pending) {
      const receipt = receipts.get(delivery.provider_ticket_id);

      try {
        if (!receipt) {
          // Absence is "not ready yet", never a failure — until the ticket is
          // old enough that it never will be.
          const giveUp = delivery.receipt_attempts + 1 >= RECEIPT_MAX_ATTEMPTS;
          await this.pushTokens.markReceiptUnresolved(delivery.id, giveUp);
          if (giveUp) abandoned++;
          else unresolved++;
          continue;
        }

        if (receipt.status === 'OK') {
          await this.pushTokens.recordReceiptOutcome(delivery.id, 'OK', 'SENT');
          confirmed++;
          continue;
        }

        const deviceGone = receipt.errorCode === DEVICE_GONE_CODE;
        await this.pushTokens.recordReceiptOutcome(
          delivery.id,
          'ERROR',
          deviceGone ? 'UNREGISTERED' : 'FAILED',
          receipt.errorCode,
          receipt.errorMessage,
        );
        failed++;

        if (deviceGone && delivery.push_token_id) {
          this.logger.warn(
            `Receipt sweep: deactivating unregistered push token ${delivery.push_token_id} for user ${delivery.user_id}`,
          );
          await this.pushTokens.deactivateTokenById(delivery.push_token_id);
          deactivated++;
        }
      } catch (err) {
        this.logger.error(
          `Receipt sweep: failed to record receipt for delivery ${delivery.id}: ${
            err instanceof Error ? err.message : err
          }`,
        );
      }
    }

    this.logger.log(
      `Receipt sweep: ${confirmed} confirmed, ${failed} failed (${deactivated} token(s) deactivated), ` +
        `${unresolved} still pending, ${abandoned} abandoned`,
    );
  }
}
