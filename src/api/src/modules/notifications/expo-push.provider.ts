import { Injectable, Logger } from '@nestjs/common';
import {
  PushProvider,
  PushMessage,
  PushResult,
  PushReceipt,
} from './push-provider.interface';

const EXPO_SEND_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

// Expo caps a getReceipts call at 1000 ids; stay well inside it so a batch is
// never rejected wholesale for being one id too long.
export const EXPO_RECEIPT_BATCH_SIZE = 300;

/**
 * The only send-time error that means the device is gone for good. Everything
 * else Expo can report at send time (rate limits, credential problems) is about
 * this attempt, not about the token — deactivating on those would silently
 * unsubscribe healthy devices.
 */
const DEVICE_GONE_CODE = 'DeviceNotRegistered';

@Injectable()
export class ExpoPushProvider implements PushProvider {
  readonly name = 'expo';
  private readonly logger = new Logger(ExpoPushProvider.name);

  async send(message: PushMessage): Promise<PushResult> {
    if (!process.env.EXPO_ACCESS_TOKEN) {
      this.logger.warn('EXPO_ACCESS_TOKEN not set — using dev fallback (no-op)');
      return { status: 'SENT', providerResult: 'dev-fallback' };
    }

    try {
      const response = await fetch(EXPO_SEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          to: message.token,
          title: message.title,
          body: message.body,
          data: message.data,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        // Expo returns 200 with error details in the body — but a non-200 is exceptional
        this.logger.error(`Expo push API returned ${response.status}: ${text}`);
        return { status: 'FAILED', errorMessage: `HTTP ${response.status}` };
      }

      const result = await response.json() as {
        data?: Array<{
          status: string;
          id?: string;
          message?: string;
          details?: { error?: string };
        }>;
      };

      if (!result.data || result.data.length === 0) {
        return { status: 'SENT' };
      }

      const ticket = result.data[0];
      const pushStatus = ticket.status;
      const pushMessage = ticket.message;

      switch (pushStatus) {
        case 'ok':
          // A ticket id, not a delivery — the receipt sweep resolves it later.
          return { status: 'SENT', providerResult: 'ok', ticketId: ticket.id };
        case 'error': {
          const code = ticket.details?.error;
          if (code === DEVICE_GONE_CODE || pushMessage?.includes(DEVICE_GONE_CODE)) {
            return { status: 'UNREGISTERED', errorMessage: pushMessage };
          }
          return { status: 'FAILED', errorMessage: pushMessage };
        }
        default:
          return { status: 'SENT', providerResult: pushStatus, ticketId: ticket.id };
      }
    } catch (err: any) {
      this.logger.error(`Expo push request failed: ${err.message}`);
      return { status: 'FAILED', errorMessage: err.message };
    }
  }

  async fetchReceipts(ticketIds: string[]): Promise<Map<string, PushReceipt>> {
    const receipts = new Map<string, PushReceipt>();
    if (ticketIds.length === 0) return receipts;

    if (!process.env.EXPO_ACCESS_TOKEN) {
      // The dev fallback never issued real tickets, so there is nothing to
      // resolve; returning an empty map lets the sweep age them out.
      this.logger.warn('EXPO_ACCESS_TOKEN not set — cannot fetch push receipts');
      return receipts;
    }

    for (let i = 0; i < ticketIds.length; i += EXPO_RECEIPT_BATCH_SIZE) {
      const batch = ticketIds.slice(i, i + EXPO_RECEIPT_BATCH_SIZE);
      try {
        const response = await fetch(EXPO_RECEIPTS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({ ids: batch }),
        });

        if (!response.ok) {
          const text = await response.text();
          this.logger.error(
            `Expo getReceipts returned ${response.status}: ${text}`,
          );
          continue;
        }

        const result = await response.json() as {
          data?: Record<string, {
            status: string;
            message?: string;
            details?: { error?: string };
          }>;
          errors?: Array<{ code?: string; message?: string }>;
        };

        if (result.errors?.length) {
          this.logger.error(
            `Expo getReceipts reported ${result.errors.length} request error(s): ${
              result.errors.map((e) => e.message ?? e.code ?? 'unknown').join('; ')
            }`,
          );
        }

        for (const [ticketId, receipt] of Object.entries(result.data ?? {})) {
          if (receipt.status === 'ok') {
            receipts.set(ticketId, { status: 'OK' });
            continue;
          }
          receipts.set(ticketId, {
            status: 'ERROR',
            errorCode: receipt.details?.error,
            errorMessage: receipt.message,
          });
        }
      } catch (err: any) {
        // A transport failure is not a verdict — leave the batch unresolved so
        // the next sweep asks again.
        this.logger.error(`Expo getReceipts request failed: ${err.message}`);
      }
    }

    return receipts;
  }
}
