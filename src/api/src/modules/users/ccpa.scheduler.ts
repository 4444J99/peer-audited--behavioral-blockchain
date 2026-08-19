import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CcpaService } from './ccpa.service';

@Injectable()
export class CcpaScheduler {
  private readonly logger = new Logger(CcpaScheduler.name);

  constructor(private readonly ccpa: CcpaService) {}

  // 4:30 AM daily — half an hour after the GDPR sweep, so the two erasure
  // paths never contend for the same rows or the TruthLog append lock.
  @Cron('30 4 * * *')
  async processPendingDeletions(): Promise<void> {
    const result = await this.ccpa.processPendingDeletions();
    if (result.processed > 0 || result.skipped > 0) {
      this.logger.log(
        `CCPA erasure sweep: processed=${result.processed}, skipped=${result.skipped}`,
      );
    }
  }
}
