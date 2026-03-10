import { Injectable } from '@nestjs/common';
import { RecoveryState, RECOVERY_MATRIX } from '../../../shared/libs/behavioral-logic';


export interface PenaltyState {
  state: RecoveryState;
  multiplier: number;
  description: string;
  delayHrs?: number;
  refundPct?: number;
  feePct?: number;
}

@Injectable()
export class DynamicPenaltyService {
  /**
   * Theorem 9: Variable-State Machine.
   * Determines the current psychological vulnerability state and associated 
   * financial multipliers based on the contract start date and current time.
   */
  calculateState(startedAt: Date, now: Date = new Date()): PenaltyState {
    const diffMs = now.getTime() - startedAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // 1. Check for Alpha/Omega Milestone (Day 90)
    if (diffDays >= RECOVERY_MATRIX[RecoveryState.ALPHA_COMPLETE].triggerDay) {
      return {
        state: RecoveryState.ALPHA_COMPLETE,
        multiplier: 1.0,
        ...RECOVERY_MATRIX[RecoveryState.ALPHA_COMPLETE],
      };
    }

    // 2. Check for Dopamine Trough (Day 21 exactly)
    if (diffDays === RECOVERY_MATRIX[RecoveryState.REWARD_INJECTION].triggerDay) {
      return {
        state: RecoveryState.REWARD_INJECTION,
        multiplier: 1.0,
        ...RECOVERY_MATRIX[RecoveryState.REWARD_INJECTION],
      };
    }

    // 3. Check for Acute Withdrawal (Day 0-14)
    // Takes precedence over weekend multiplier during the panic phase
    if (diffDays <= RECOVERY_MATRIX[RecoveryState.LOCKDOWN].endDay) {
      return {
        state: RecoveryState.LOCKDOWN,
        ...RECOVERY_MATRIX[RecoveryState.LOCKDOWN],
      };
    }

    // 4. Check for Structural Isolation (Weekend)
    if (this.isWeekend(now)) {
      return {
        state: RecoveryState.WEEKEND_SHIELD,
        ...RECOVERY_MATRIX[RecoveryState.WEEKEND_SHIELD],
      };
    }

    // 5. Check for Bargaining Stage (Day 45-60)
    if (
      diffDays >= RECOVERY_MATRIX[RecoveryState.FRICTION_DELAY].startDay &&
      diffDays <= RECOVERY_MATRIX[RecoveryState.FRICTION_DELAY].endDay
    ) {
      return {
        state: RecoveryState.FRICTION_DELAY,
        ...RECOVERY_MATRIX[RecoveryState.FRICTION_DELAY],
      };
    }


    // Default: Normal State
    return {
      state: RecoveryState.NORMAL,
      multiplier: 1.0,
      description: 'Baseline stability',
    };
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay(); // 0=Sun, 5=Fri, 6=Sat
    const hour = date.getHours();

    // Friday 5PM (17:00) to Sunday 9AM (09:00)
    if (day === 5 && hour >= 17) return true;
    if (day === 6) return true;
    if (day === 0 && hour < 9) return true;

    return false;
  }
}
