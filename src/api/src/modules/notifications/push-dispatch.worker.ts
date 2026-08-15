import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { PUSH_DISPATCH_QUEUE_NAME, getRedisConnectionConfig } from '../../../config/queue.config';
import { PushTokensService } from './push-tokens.service';
import { ExpoPushProvider } from './expo-push.provider';

interface PushJob {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class PushDispatchWorker implements OnModuleInit {
  private readonly logger = new Logger(PushDispatchWorker.name);
  private worker!: Worker;

  constructor(
    private readonly pushTokens: PushTokensService,
    private readonly provider: ExpoPushProvider,
  ) {}

  onModuleInit() {
    this.worker = new Worker<PushJob>(
      PUSH_DISPATCH_QUEUE_NAME,
      async (job: Job<PushJob>) => this.process(job),
      { connection: getRedisConnectionConfig(), concurrency: 4 },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Push dispatch job ${job?.id} failed: ${err.message}`);
    });

    this.logger.log('Push dispatch worker initialized');
  }

  private async process(job: Job<PushJob>): Promise<void> {
    const { userId, type, title, body, metadata } = job.data;

    const tokens = await this.pushTokens.getActiveTokens(userId);
    if (tokens.length === 0) {
      this.logger.debug(`No push tokens for user ${userId} — skipping push`);
      return;
    }

    const data = metadata as Record<string, string> | undefined;

    for (const t of tokens) {
      const result = await this.provider.send({
        token: t.token,
        title,
        body: body ?? undefined,
        data,
      });

      await this.pushTokens.markDelivery(
        t.id,
        userId,
        type,
        title,
        body ?? null,
        metadata ?? null,
        'expo',
        result.status,
        result.providerResult,
        result.errorMessage,
        result.ticketId,
      );

      if (result.status === 'UNREGISTERED') {
        this.logger.warn(`Deactivating unregistered push token ${t.id} for user ${userId}`);
        await this.pushTokens.unregisterToken(userId, t.token);
      }
    }

    this.logger.log(`Push sent to ${tokens.length} device(s) for user ${userId} [${type}]`);
  }
}
