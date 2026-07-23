import { Injectable, Logger } from '@nestjs/common';
import { PushProvider, PushMessage, PushResult } from './push-provider.interface';

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
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
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
        data?: Array<{ status: string; message?: string }>;
      };

      if (!result.data || result.data.length === 0) {
        return { status: 'SENT' };
      }

      const pushStatus = result.data[0].status;
      const pushMessage = result.data[0].message;

      switch (pushStatus) {
        case 'ok':
          return { status: 'SENT', providerResult: 'ok' };
        case 'error': {
          // Expo returns detailed error messages for specific failures
          if (pushMessage?.includes('DeviceNotRegistered') ||
              pushMessage?.includes('InvalidCredentials') ||
              pushMessage?.includes('MessageRateExceeded')) {
            return { status: 'UNREGISTERED', errorMessage: pushMessage };
          }
          return { status: 'FAILED', errorMessage: pushMessage };
        }
        default:
          return { status: 'SENT', providerResult: pushStatus };
      }
    } catch (err: any) {
      this.logger.error(`Expo push request failed: ${err.message}`);
      return { status: 'FAILED', errorMessage: err.message };
    }
  }
}
