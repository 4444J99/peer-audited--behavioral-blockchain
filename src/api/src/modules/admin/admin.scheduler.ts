import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

@Injectable()
export class AdminScheduler {
  private readonly logger = new Logger(AdminScheduler.name);

  constructor(private readonly truthLog: TruthLogService) {}

  @Cron('0 3 * * *') // 3 AM daily
  async verifyHashChain(): Promise<void> {
    const result = await this.truthLog.verifyChain();
    if (!result.valid) {
      this.logger.error(
        `HASH CHAIN CORRUPTION: ${result.corrupted.length} corrupted entries`,
      );
    } else {
      this.logger.log(
        `Hash chain verified: ${result.checked} events, all valid`,
      );
    }
  }
}
