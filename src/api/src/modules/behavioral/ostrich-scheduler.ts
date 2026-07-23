import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OstrichDetectionService } from './ostrich-detection.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OstrichScheduler {
  private readonly logger = new Logger(OstrichScheduler.name);

  constructor(
    private readonly detection: OstrichDetectionService,
    @Optional() @Inject(NotificationsService)
    private readonly notifications?: NotificationsService,
  ) {}

  /**
   * F-AEGIS-09: Every 6 hours, detect avoidance patterns and send interventions.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async detectAndIntervene(): Promise<void> {
    const atRisk = await this.detection.detectAtRiskUsers();

    if (atRisk.length === 0) {
      return;
    }

    this.logger.log(`[Ostrich] Detected ${atRisk.length} at-risk user(s)`);

    for (const user of atRisk) {
      await this.intervene(user);
    }
  }

  private async intervene(user: {
    userId: string;
    activeContracts: number;
    daysSinceLastActive: number;
    consecutiveMissedProofs: number;
    riskLevel: string;
  }): Promise<void> {
    if (!this.notifications) {
      this.logger.debug(`[Ostrich] Would intervene with user ${user.userId} (risk: ${user.riskLevel})`);
      return;
    }

    if (user.riskLevel === 'HIGH') {
      await this.notifications.create({
        userId: user.userId,
        type: 'OSTRICH_HIGH',
        title: 'We noticed you\'ve been away',
        body: `It's been ${user.daysSinceLastActive} days — your contracts need you. What's one small step you can take right now?`,
        metadata: {
          riskLevel: user.riskLevel,
          daysSinceLastActive: user.daysSinceLastActive,
          consecutiveMissedProofs: user.consecutiveMissedProofs,
          activeContracts: user.activeContracts,
          protocol: 'OSTRICH_EFFECT',
        },
      });
      this.logger.log(`[Ostrich] HIGH intervention sent to user ${user.userId}`);
    } else if (user.riskLevel === 'MEDIUM') {
      await this.notifications.create({
        userId: user.userId,
        type: 'OSTRICH_MEDIUM',
        title: 'A gentle check-in',
        body: user.consecutiveMissedProofs >= 3
          ? `You've missed ${user.consecutiveMissedProofs} check-ins in a row. Remember: perfection isn't the goal — showing up is.`
          : `Haven't seen you in ${user.daysSinceLastActive} days. Your ${user.activeContracts} active contract(s) are waiting.`,
        metadata: {
          riskLevel: user.riskLevel,
          daysSinceLastActive: user.daysSinceLastActive,
          consecutiveMissedProofs: user.consecutiveMissedProofs,
          activeContracts: user.activeContracts,
          protocol: 'OSTRICH_EFFECT',
        },
      });
      this.logger.log(`[Ostrich] MEDIUM intervention sent to user ${user.userId}`);
    }
  }
}
