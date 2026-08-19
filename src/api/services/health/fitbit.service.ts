import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { TruthLogService } from '../ledger/truth-log.service';

export enum FitbitReadinessState {
  READY = 'READY',
  NOT_READY = 'NOT_READY',
}

export enum FitbitDataProvenance {
  /**
   * Data fetched server-side from Fitbit's API after a signature-verified
   * subscription notification. The ONLY provenance that may credit attestations.
   */
  VERIFIED_WEBHOOK = 'VERIFIED_WEBHOOK',
  /** User-typed data. Journal-only — can never credit attestation state. */
  MANUAL = 'MANUAL',
}

export interface FitbitWebhookPayload {
  userId: string;
  contractId: string;
  provenance: FitbitDataProvenance;
  readinessScore?: number;
  sleepScore?: number;
  restingHeartRate?: number;
  hrv?: number;
  state: FitbitReadinessState;
  recordedAt?: string;
  source?: string;
}

export interface FitbitSleepPayload {
  userId: string;
  contractId: string;
  provenance: FitbitDataProvenance;
  sleepMinutes: number;
  sleepDate: string;
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
  source?: string;
}

export interface FitbitManualEntryPayload {
  userId: string;
  contractId: string;
  readinessScore?: number;
  sleepScore?: number;
  restingHeartRate?: number;
  hrv?: number;
  sleepMinutes?: number;
  note?: string;
}

@Injectable()
export class FitbitService {
  private readonly logger = new Logger(FitbitService.name);

  constructor(
    private readonly pool: Pool,
    private readonly truthLog: TruthLogService,
  ) {}

  /**
   * Process a Fitbit daily readiness signal derived from a verified webhook.
   * Only RECOVERY_* contracts accept Fitbit readiness signals.
   * READY state triggers daily attestation credit (same pattern as Whoop SCORED).
   *
   * Gate 02 invariant: attestation-crediting data may only enter through the
   * signature-verified webhook + server-side fetch path. Any other provenance
   * is treated as a spoof attempt and rejected before touching contract state.
   */
  async processReadinessState(payload: FitbitWebhookPayload): Promise<{
    status: 'recorded' | 'ignored';
    state: FitbitReadinessState;
    attestationApplied: boolean;
  }> {
    await this.assertVerifiedProvenance(payload.provenance, payload.contractId, payload.userId, payload.source);

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
        provenance: payload.provenance,
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
      provenance: payload.provenance,
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
   * Process Fitbit sleep data fetched server-side after a verified notification.
   * Validates sleep data plausibility and records it for contract advancement.
   */
  async processSleepData(payload: FitbitSleepPayload): Promise<{ accepted: boolean; reason?: string }> {
    await this.assertVerifiedProvenance(payload.provenance, payload.contractId, payload.userId, payload.source);

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
      provenance: payload.provenance,
      sleepMinutes: payload.sleepMinutes,
      sleepDate: payload.sleepDate,
      deepSleepMinutes: payload.deepSleepMinutes,
      remSleepMinutes: payload.remSleepMinutes,
      source: payload.source || 'fitbit-webhook',
    });

    return { accepted: true };
  }

  /**
   * Record a MANUAL self-reported wellness entry. Journal-only: this path never
   * reads or writes attestations, and there is no parameter through which a
   * caller can escalate a manual entry into hardware-oracle state.
   */
  async recordManualEntry(payload: FitbitManualEntryPayload): Promise<{
    status: 'recorded';
    provenance: FitbitDataProvenance.MANUAL;
    attestationApplied: false;
  }> {
    const contract = await this.pool.query(
      `SELECT id, user_id FROM contracts WHERE id = $1`,
      [payload.contractId],
    );

    if (contract.rows.length === 0) {
      throw new NotFoundException(`Contract ${payload.contractId} not found`);
    }

    if (contract.rows[0].user_id !== payload.userId) {
      throw new ForbiddenException('You do not own this contract');
    }

    await this.truthLog.appendEvent('FITBIT_MANUAL_ENTRY_RECORDED', {
      contractId: payload.contractId,
      userId: payload.userId,
      provenance: FitbitDataProvenance.MANUAL,
      readinessScore: payload.readinessScore,
      sleepScore: payload.sleepScore,
      restingHeartRate: payload.restingHeartRate,
      hrv: payload.hrv,
      sleepMinutes: payload.sleepMinutes,
      note: payload.note,
      attestationApplied: false,
      recordedAt: new Date().toISOString(),
    });

    return {
      status: 'recorded',
      provenance: FitbitDataProvenance.MANUAL,
      attestationApplied: false,
    };
  }

  // Typed `| undefined` deliberately: legacy/JS callers may omit provenance,
  // and an absent value must fail closed exactly like MANUAL.
  private async assertVerifiedProvenance(
    provenance: FitbitDataProvenance | undefined,
    contractId: string,
    userId: string,
    source?: string,
  ): Promise<void> {
    if (provenance !== FitbitDataProvenance.VERIFIED_WEBHOOK) {
      this.logger.warn(
        `Rejected Fitbit ingestion with unverified provenance '${provenance}' for contract ${contractId}`,
      );
      await this.truthLog.appendEvent('FITBIT_UNVERIFIED_CREDIT_ATTEMPT', {
        contractId,
        userId,
        provenance: provenance ?? 'UNKNOWN',
        source: source || 'unknown',
        recordedAt: new Date().toISOString(),
      });
      throw new ForbiddenException(
        'Fitbit ingestion requires verified webhook provenance; self-reported data never credits attestations',
      );
    }
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
   * Replicates the pattern from ContractsService.submitAttestation: the day is
   * keyed on attestation_date (the unique key the scheduler also writes), and the
   * row carries a `source` provenance tag so a hardware-oracle credit is
   * distinguishable from a self-reported one (Gate 02).
   */
  private async submitAttestation(contractId: string, userId: string): Promise<void> {
    const existing = await this.pool.query(
      `SELECT id, status FROM attestations
       WHERE contract_id = $1 AND user_id = $2 AND attestation_date = CURRENT_DATE
       LIMIT 1`,
      [contractId, userId],
    );

    // A day the user already resolved — attested, cosigned, or admitted as a
    // relapse — is terminal. A wearable signal never overwrites it.
    if (
      existing.rows.length > 0 &&
      ['ATTESTED', 'COSIGNED', 'RELAPSED'].includes(existing.rows[0].status)
    ) {
      throw new BadRequestException('Already attested today');
    }

    await this.pool.query(
      `INSERT INTO attestations (contract_id, user_id, attestation_date, status, attested_at, source)
       VALUES ($1, $2, CURRENT_DATE, 'ATTESTED', NOW(), 'fitbit-readiness')
       ON CONFLICT (contract_id, attestation_date) DO UPDATE SET status = 'ATTESTED', attested_at = NOW(),
       source = EXCLUDED.source
       WHERE attestations.status NOT IN ('ATTESTED', 'COSIGNED', 'RELAPSED')`,
      [contractId, userId],
    );
  }
}
