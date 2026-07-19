import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GdprService } from './gdpr.service';

@Injectable()
export class GdprScheduler {
  private readonly logger = new Logger(GdprScheduler.name);

  constructor(private readonly gdpr: GdprService) {}

  @Cron('0 4 * * *') // 4 AM daily
  async processPendingDeletions(): Promise<void> {
    const result = await this.gdpr.processPendingDeletions();
    if (result.processed > 0 || result.skipped > 0) {
      this.logger.log(
        `GDPR erasure sweep: processed=${result.processed}, skipped=${result.skipped}`,
      );
    }
  }
}
