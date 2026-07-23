import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { TruthLogService } from '../ledger/truth-log.service';

export enum FitbitReadinessState {
  READY = 'READY',
  NOT_READY = 'NOT_READY',
}

export interface FitbitWebhookPayload {
  userId: string;
  contractId: string;
  readinessScore?: number;
  sleepScore?: number;
  restingHeartRate?: number;
  hrv?: number;
  state: FitbitReadinessState;
  recordedAt?: string;
  source?: string;
}

@Injectable()
export class FitbitService {
  private readonly logger = new Logger(FitbitService.name);

  constructor(
    private readonly pool: Pool,
    private readonly truthLog: TruthLogService,
  ) {}

  /**
   * Process a Fitbit daily readiness webhook.
   * Only RECOVERY_* contracts accept Fitbit readiness signals.
   * READY state triggers daily attestation credit (same pattern as Whoop SCORED).
   */
  async processReadinessState(payload: FitbitWebhookPayload): Promise<{
    status: 'recorded' | 'ignored';
    state: FitbitReadinessState;
    attestationApplied: boolean;
  }> {
    const contract = await this.pool.query(
      `SELECT id, user_id, oath_category, status
       FROM contracts WHERE id = $1`,
      [payload.contractId],
    );

    if (contract.rows.length === 0) {
      throw new NotFoundException(`Contract ${payload.contractId} not found`);
    }

    const c = contract.rows[0];
    if (c.user_id !== payload.userId) {
      throw new ForbiddenException('You do not own this contract');
    }

    if (c.status !== 'ACTIVE') {
      throw new BadRequestException('Contract is not active');
    }

    if (!String(c.oath_category || '').startsWith('RECOVERY_')) {
      throw new BadRequestException(
        'Fitbit readiness ingestion is only available for Recovery stream contracts',
      );
    }

    const state = String(payload.state || '').toUpperCase() as FitbitReadinessState;
    if (state !== FitbitReadinessState.READY) {
      await this.truthLog.appendEvent('FITBIT_STATE_IGNORED', {
        contractId: payload.contractId,
        userId: payload.userId,
        state,
        source: payload.source || 'fitbit-webhook',
        recordedAt: payload.recordedAt || new Date().toISOString(),
      });
      return {
        status: 'ignored',
        state,
        attestationApplied: false,
      };
    }

    // Validate biometric plausibility if provided
    if (payload.restingHeartRate !== undefined) {
      this.validateHeartRate(payload.restingHeartRate);
    }
    if (payload.hrv !== undefined) {
      this.validateHRV(payload.hrv);
    }

    // Credit daily attestation via the contracts service submitAttestation pattern
    let attestationApplied = false;
    try {
      await this.submitAttestation(payload.contractId, payload.userId);
      attestationApplied = true;
    } catch (err) {
      if (
        err instanceof BadRequestException &&
        /Already attested today/i.test(err.message)
      ) {
        attestationApplied = false;
      } else {
        throw err;
      }
    }

    await this.truthLog.appendEvent('FITBIT_READINESS_RECEIVED', {
      contractId: payload.contractId,
      userId: payload.userId,
      state,
      readinessScore: payload.readinessScore,
      sleepScore: payload.sleepScore,
      restingHeartRate: payload.restingHeartRate,
      hrv: payload.hrv,
      source: payload.source || 'fitbit-webhook',
      recordedAt: payload.recordedAt || new Date().toISOString(),
      attestationApplied,
    });

    return {
      status: 'recorded',
      state,
      attestationApplied,
    };
  }

  /**
   * Process a Fitbit sleep log webhook.
   * Validates sleep data plausibility and records it for contract advancement.
   */
  async processSleepData(payload: {
    userId: string;
    contractId: string;
    sleepMinutes: number;
    sleepDate: string;
    deepSleepMinutes?: number;
    remSleepMinutes?: number;
    source?: string;
  }): Promise<{ accepted: boolean; reason?: string }> {
    const contract = await this.pool.query(
      `SELECT id, user_id, oath_category, status
       FROM contracts WHERE id = $1`,
      [payload.contractId],
    );

    if (contract.rows.length === 0) {
      throw new NotFoundException(`Contract ${payload.contractId} not found`);
    }

    const c = contract.rows[0];
    if (c.user_id !== payload.userId) {
      throw new ForbiddenException('You do not own this contract');
    }

    if (c.status !== 'ACTIVE') {
      return { accepted: false, reason: 'Contract is not active' };
    }

    // Plausibility: sleep between 0 and 24 hours
    if (payload.sleepMinutes < 0 || payload.sleepMinutes > 24 * 60) {
      return { accepted: false, reason: 'Sleep duration out of plausible range' };
    }

    // Deep + REM should not exceed total sleep
    if (payload.deepSleepMinutes !== undefined && payload.remSleepMinutes !== undefined) {
      if (payload.deepSleepMinutes + payload.remSleepMinutes > payload.sleepMinutes) {
        return { accepted: false, reason: 'Deep + REM sleep exceeds total sleep' };
      }
    }

    await this.truthLog.appendEvent('FITBIT_SLEEP_RECEIVED', {
      contractId: payload.contractId,
      userId: payload.userId,
      sleepMinutes: payload.sleepMinutes,
      sleepDate: payload.sleepDate,
      deepSleepMinutes: payload.deepSleepMinutes,
      remSleepMinutes: payload.remSleepMinutes,
      source: payload.source || 'fitbit-webhook',
    });

    return { accepted: true };
  }

  private validateHeartRate(bpm: number): void {
    if (bpm < 20 || bpm > 250) {
      this.logger.warn(`Fitbit resting heart rate ${bpm} bpm outside plausible range [20, 250]`);
    }
  }

  private validateHRV(ms: number): void {
    if (ms < 0 || ms > 300) {
      this.logger.warn(`Fitbit HRV ${ms}ms outside plausible range [0, 300]`);
    }
  }

  /**
   * Submit daily attestation for a contract.
   * Replicates the pattern from ContractsService.submitAttestation.
   */
  private async submitAttestation(contractId: string, userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const existing = await this.pool.query(
      `SELECT id FROM attestations
       WHERE contract_id = $1 AND user_id = $2 AND attested_at::date = $3::date
       LIMIT 1`,
      [contractId, userId, today],
    );

    if (existing.rows.length > 0) {
      throw new BadRequestException('Already attested today');
    }

    await this.pool.query(
      `INSERT INTO attestations (contract_id, user_id, source, attested_at)
       VALUES ($1, $2, 'fitbit-readiness', NOW())`,
      [contractId, userId],
    );
  }
}
