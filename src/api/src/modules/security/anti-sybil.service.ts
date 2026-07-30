import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { createHash } from 'crypto';

export interface DeviceFingerprint {
  hash: string;
  platform: 'ios' | 'android' | 'web';
  rawVendorId?: string;
}

export interface SybilSignal {
  id: string;
  userId: string;
  signalType: 'SHARED_DEVICE' | 'SHARED_IP' | 'SHARED_PAYMENT' | 'SHARED_PHONE';
  relatedUserId: string;
  confidence: number;
  detectedAt: Date;
}

export interface SybilVerdict {
  userId: string;
  riskScore: number;
  signals: SybilSignal[];
  enforcementAction: 'NONE' | 'WARNING' | 'ACCOUNT_MERGE' | 'BAN';
  duplicateCount: number;
}

const SIGNAL_CONFIDENCE: Record<SybilSignal['signalType'], number> = {
  SHARED_DEVICE: 30,
  SHARED_IP: 15,
  SHARED_PAYMENT: 40,
  SHARED_PHONE: 35,
};

@Injectable()
export class AntiSybilService {
  private readonly logger = new Logger(AntiSybilService.name);

  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
  ) {}

  static hashFingerprint(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  async registerDeviceFingerprint(
    userId: string,
    fingerprint: DeviceFingerprint,
  ): Promise<void> {
    const hashed = fingerprint.rawVendorId
      ? AntiSybilService.hashFingerprint(fingerprint.rawVendorId)
      : fingerprint.hash;

    await this.pool.query(
      `INSERT INTO sybil_device_fingerprints (user_id, device_hash, platform, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, device_hash)
       DO UPDATE SET last_seen_at = NOW()`,
      [userId, hashed, fingerprint.platform],
    );
  }

  async detectSharedDevice(fingerprintHash: string): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT user_id FROM sybil_device_fingerprints
       WHERE device_hash = $1`,
      [fingerprintHash],
    );
    return result.rows.map((r: { user_id: string }) => r.user_id);
  }

  async detectSharedPayment(userId: string): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT c2.user_id
       FROM contracts c1
       JOIN contracts c2 ON c1.payment_intent_id = c2.payment_intent_id
         AND c2.user_id != c1.user_id
       WHERE c1.user_id = $1
         AND c1.payment_intent_id IS NOT NULL`,
      [userId],
    );
    return result.rows.map((r: { user_id: string }) => r.user_id);
  }

  async detectSharedIP(userId: string, ip: string): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT user_id FROM proofs
       WHERE ip_address = $1
         AND user_id != $2
         AND created_at >= NOW() - INTERVAL '30 days'`,
      [ip, userId],
    );
    return result.rows.map((r: { user_id: string }) => r.user_id);
  }

  async analyzeUser(userId: string): Promise<SybilVerdict> {
    const signals: SybilSignal[] = [];

    const deviceResult = await this.pool.query(
      `SELECT device_hash FROM sybil_device_fingerprints WHERE user_id = $1`,
      [userId],
    );

    for (const row of deviceResult.rows) {
      const shared = await this.detectSharedDevice(row.device_hash);
      for (const relatedId of shared) {
        if (relatedId !== userId) {
          signals.push({
            id: '',
            userId,
            signalType: 'SHARED_DEVICE',
            relatedUserId: relatedId,
            confidence: SIGNAL_CONFIDENCE.SHARED_DEVICE,
            detectedAt: new Date(),
          });
        }
      }
    }

    const paymentMatches = await this.detectSharedPayment(userId);
    for (const relatedId of paymentMatches) {
      signals.push({
        id: '',
        userId,
        signalType: 'SHARED_PAYMENT',
        relatedUserId: relatedId,
        confidence: SIGNAL_CONFIDENCE.SHARED_PAYMENT,
        detectedAt: new Date(),
      });
    }

    const ipResult = await this.pool.query(
      `SELECT ip_address FROM proofs
       WHERE user_id = $1 AND ip_address IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );

    if (ipResult.rows.length > 0) {
      const ip = ipResult.rows[0].ip_address;
      const ipMatches = await this.detectSharedIP(userId, ip);
      for (const relatedId of ipMatches) {
        signals.push({
          id: '',
          userId,
          signalType: 'SHARED_IP',
          relatedUserId: relatedId,
          confidence: SIGNAL_CONFIDENCE.SHARED_IP,
          detectedAt: new Date(),
        });
      }
    }

    const riskScore = Math.min(
      100,
      signals.reduce((sum, s) => sum + s.confidence, 0),
    );

    let enforcementAction: SybilVerdict['enforcementAction'] = 'NONE';
    if (riskScore >= 61) enforcementAction = 'BAN';
    else if (riskScore >= 31) enforcementAction = 'ACCOUNT_MERGE';
    else if (riskScore >= 1) enforcementAction = 'WARNING';

    const uniqueDuplicates = new Set(signals.map((s) => s.relatedUserId));

    return {
      userId,
      riskScore,
      signals,
      enforcementAction,
      duplicateCount: uniqueDuplicates.size,
    };
  }

  async getSignalHistory(userId: string): Promise<SybilSignal[]> {
    const result = await this.pool.query(
      `SELECT id, user_id, signal_type, related_user_id, confidence, detected_at
       FROM sybil_signals
       WHERE user_id = $1
       ORDER BY detected_at DESC`,
      [userId],
    );

    return result.rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      signalType: r.signal_type,
      relatedUserId: r.related_user_id,
      confidence: r.confidence,
      detectedAt: r.detected_at,
    }));
  }

  async recordSignal(
    signal: Omit<SybilSignal, 'id' | 'detectedAt'>,
  ): Promise<SybilSignal> {
    const result = await this.pool.query(
      `INSERT INTO sybil_signals (user_id, signal_type, related_user_id, confidence)
       VALUES ($1, $2, $3, $4)
       RETURNING id, detected_at`,
      [signal.userId, signal.signalType, signal.relatedUserId, signal.confidence],
    );

    return {
      ...signal,
      id: result.rows[0].id,
      detectedAt: result.rows[0].detected_at,
    };
  }

  async appealSharedDevice(
    userId: string,
    relatedUserId: string,
    reason: string,
  ): Promise<{ accepted: boolean; message: string }> {
    const lowerReason = reason.toLowerCase();
    const isFamilyReason =
      lowerReason.includes('family') || lowerReason.includes('household');

    if (isFamilyReason) {
      const phones = await this.pool.query(
        `SELECT DISTINCT phone_number FROM users
         WHERE id IN ($1, $2) AND phone_number IS NOT NULL`,
        [userId, relatedUserId],
      );

      const uniquePhones = new Set(
        phones.rows.map((r: { phone_number: string }) => r.phone_number),
      );

      if (uniquePhones.size >= 2) {
        this.logger.log(
          `Sybil appeal accepted: ${userId} <-> ${relatedUserId} (family, different phones)`,
        );
        return {
          accepted: true,
          message: 'Appeal accepted: shared family device with separate phone numbers.',
        };
      }
    }

    this.logger.log(
      `Sybil appeal flagged for review: ${userId} <-> ${relatedUserId}`,
    );
    return {
      accepted: false,
      message: 'Appeal flagged for manual review by the trust & safety team.',
    };
  }
}
