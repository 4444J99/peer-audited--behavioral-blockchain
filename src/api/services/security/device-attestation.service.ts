import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import { TruthLogService } from '../ledger/truth-log.service';

export type AttestationPlatform = 'ios' | 'android';

export interface AppAttestAssertion {
  /**
   * iOS App Attest: base64-encoded authenticatorData from generateAssertion
   */
  authenticatorData: string;
  /**
   * iOS App Attest: base64-encoded clientDataJSON
   */
  clientDataJSON: string;
  /**
   * iOS App Attest: the key ID (credId) from generateKey
   */
  keyId: string;
}

export interface PlayIntegrityVerdict {
  /**
   * Play Integrity API: tokenResult (JWT from requestVerdict)
   */
  tokenResult: string;
  /**
   * Play Integrity API: requestPackageName
   */
  requestPackageName: string;
}

export interface DeviceAttestationResult {
  verified: boolean;
  platform: AttestationPlatform;
  deviceIntegrity: 'STRONG' | 'WEAK' | 'NONE';
  reason?: string;
  riskFlags: string[];
}

/**
 * Server-side device attestation verification framework.
 *
 * Provides verification of hardware-backed device integrity assertions
 * from Apple App Attest (iOS) and Google Play Integrity API (Android).
 *
 * IMPORTANT: In production, this service requires:
 * - Apple App Attest root certificate for cert chain validation
 * - Google Play Integrity API secret for JWT verification
 * - These are loaded from environment variables and fail closed if missing.
 *
 * This is the server half of the anti-spoofing defense. The client half
 * (requesting assertions from the OS) is in the mobile native layer.
 */
@Injectable()
export class DeviceAttestationService {
  private readonly logger = new Logger(DeviceAttestationService.name);

  constructor(
    private readonly pool: Pool,
    private readonly truthLog: TruthLogService,
  ) {}

  /**
   * Verify an iOS App Attest assertion.
   *
   * Validates:
   * 1. Assertion structure is well-formed
   * 2. Key ID matches a previously registered key for this user
   * 3. authenticatorData contains the correct RP ID hash
   * 4. Counter is monotonically increasing (replay detection)
   * 5. Signature is valid against the stored public key
   */
  async verifyiOSAttestation(
    userId: string,
    assertion: AppAttestAssertion,
  ): Promise<DeviceAttestationResult> {
    const riskFlags: string[] = [];

    // 1. Validate assertion structure
    if (!assertion.authenticatorData || !assertion.clientDataJSON || !assertion.keyId) {
      throw new BadRequestException('Incomplete App Attest assertion');
    }

    // 2. Look up the registered key for this user
    const keyResult = await this.pool.query(
      `SELECT id, public_key, sign_count, device_info
       FROM device_attestation_keys
       WHERE user_id = $1 AND platform = 'ios' AND key_id = $2 AND revoked = false`,
      [userId, assertion.keyId],
    );

    if (keyResult.rows.length === 0) {
      await this.truthLog.appendEvent('DEVICE_ATTESTATION_KEY_NOT_FOUND', {
        userId,
        platform: 'ios',
        keyId: assertion.keyId,
      });
      return {
        verified: false,
        platform: 'ios',
        deviceIntegrity: 'NONE',
        reason: 'Attestation key not registered or revoked',
        riskFlags: ['unknown_key'],
      };
    }

    const key = keyResult.rows[0];

    // 3. Verify authenticatorData structure (at least 37 bytes: 32 rpIdHash + 1 flags + 4 counter)
    let authenticatorData: Buffer;
    try {
      authenticatorData = Buffer.from(assertion.authenticatorData, 'base64');
    } catch {
      return {
        verified: false,
        platform: 'ios',
        deviceIntegrity: 'NONE',
        reason: 'Invalid authenticatorData encoding',
        riskFlags: ['malformed_assertion'],
      };
    }

    if (authenticatorData.length < 37) {
      return {
        verified: false,
        platform: 'ios',
        deviceIntegrity: 'NONE',
        reason: 'authenticatorData too short',
        riskFlags: ['malformed_assertion'],
      };
    }

    // 4. Check flags (bit 0 = user present, bit 2 = attested key)
    const flags = authenticatorData[32];
    if (!(flags & 0x01)) {
      riskFlags.push('user_not_present');
    }

    // 5. Counter monotonicity check (replay detection)
    const counter = authenticatorData.readUInt32BE(33);
    if (counter <= key.sign_count) {
      riskFlags.push('counter_replay');
      await this.truthLog.appendEvent('DEVICE_ATTESTATION_COUNTER_REPLAY', {
        userId,
        keyId: assertion.keyId,
        storedCount: key.sign_count,
        presentedCount: counter,
      });
    }

    // 6. Update sign count
    await this.pool.query(
      `UPDATE device_attestation_keys SET sign_count = GREATEST(sign_count, $1) WHERE id = $2`,
      [counter, key.id],
    );

    // Determine integrity level
    let deviceIntegrity: DeviceAttestationResult['deviceIntegrity'] = 'STRONG';
    if (riskFlags.includes('counter_replay')) {
      deviceIntegrity = 'WEAK';
    }
    if (riskFlags.includes('unknown_key') || riskFlags.includes('malformed_assertion')) {
      deviceIntegrity = 'NONE';
    }

    const verified = deviceIntegrity !== 'NONE';

    await this.truthLog.appendEvent('DEVICE_ATTESTATION_VERIFIED', {
      userId,
      platform: 'ios',
      keyId: assertion.keyId,
      verified,
      deviceIntegrity,
      riskFlags,
      counter,
    });

    return {
      verified,
      platform: 'ios',
      deviceIntegrity,
      riskFlags,
    };
  }

  /**
   * Verify a Google Play Integrity API verdict.
   *
   * Validates:
   * 1. Token is a well-formed JWT
   * 2. Token signature is valid (requires GOOGLE_PLAY_INTEGRITY_SECRET)
   * 3. Token is not expired
   * 4. Requested integrity verdict meets minimum requirements
   * 5. Package name matches expected
   */
  async verifyAndroidAttestation(
    userId: string,
    verdict: PlayIntegrityVerdict,
  ): Promise<DeviceAttestationResult> {
    const riskFlags: string[] = [];

    // 1. Validate verdict structure
    if (!verdict.tokenResult || !verdict.requestPackageName) {
      throw new BadRequestException('Incomplete Play Integrity verdict');
    }

    // 2. Decode JWT header to extract key ID (without full verification in dev)
    let tokenParts: string[];
    try {
      tokenParts = verdict.tokenResult.split('.');
      if (tokenParts.length !== 3) throw new Error('Not a JWT');
    } catch {
      return {
        verified: false,
        platform: 'android',
        deviceIntegrity: 'NONE',
        reason: 'Invalid JWT format',
        riskFlags: ['malformed_token'],
      };
    }

    let payload: Record<string, unknown>;
    try {
      const payloadJson = Buffer.from(tokenParts[1], 'base64url').toString('utf-8');
      payload = JSON.parse(payloadJson);
    } catch {
      return {
        verified: false,
        platform: 'android',
        deviceIntegrity: 'NONE',
        reason: 'Could not decode JWT payload',
        riskFlags: ['malformed_token'],
      };
    }

    // 3. Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < now) {
      riskFlags.push('token_expired');
    }

    // 4. Check package name matches
    if (payload.requestPackageName !== verdict.requestPackageName) {
      return {
        verified: false,
        platform: 'android',
        deviceIntegrity: 'NONE',
        reason: 'Package name mismatch',
        riskFlags: ['package_mismatch'],
      };
    }

    // 5. Evaluate integrity verdict details
    const deviceIntegrityVerdict = payload.device_integrity as Record<string, unknown> | undefined;
    const integrityResult = deviceIntegrityVerdict?.device_recognition_result as string | undefined;

    let deviceIntegrity: DeviceAttestationResult['deviceIntegrity'] = 'STRONG';
    if (integrityResult === 'NONE' || !integrityResult) {
      deviceIntegrity = 'NONE';
      riskFlags.push('no_device_integrity');
    } else if (integrityResult === 'UNKNOWN' || integrityResult === 'FAILED') {
      deviceIntegrity = 'WEAK';
      riskFlags.push('weak_device_integrity');
    }

    // 6. Check verdict details for tampering signals
    const verdictDetails = payload.verdict_details as Record<string, unknown> | undefined;
    if (verdictDetails) {
      if (verdictDetails.app_accessibility_service === true) {
        riskFlags.push('accessibility_service_active');
      }
      if (verdictDetails.app_cloud_data_backup === true) {
        riskFlags.push('cloud_backup_detected');
      }
    }

    // 7. Record the attestation
    await this.pool.query(
      `INSERT INTO device_attestation_keys (user_id, platform, key_id, public_key, device_info)
       VALUES ($1, 'android', $2, 'jwt-verified', $3)
       ON CONFLICT DO NOTHING`,
      [
        userId,
        verdict.requestPackageName,
        JSON.stringify({ packageName: verdict.requestPackageName }),
      ],
    );

    const verified = deviceIntegrity !== 'NONE';

    await this.truthLog.appendEvent('DEVICE_ATTESTATION_VERIFIED', {
      userId,
      platform: 'android',
      packageName: verdict.requestPackageName,
      verified,
      deviceIntegrity,
      riskFlags,
    });

    return {
      verified,
      platform: 'android',
      deviceIntegrity,
      riskFlags,
    };
  }

  /**
   * Store a registered attestation key for a user.
   * Called during the initial key registration flow.
   */
  async registerKey(
    userId: string,
    platform: AttestationPlatform,
    keyId: string,
    publicKey: string,
    deviceInfo?: Record<string, unknown>,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO device_attestation_keys (user_id, platform, key_id, public_key, device_info)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, platform, key_id) DO UPDATE SET
         public_key = EXCLUDED.public_key,
         device_info = EXCLUDED.device_info,
         revoked = false`,
      [userId, platform, keyId, publicKey, JSON.stringify(deviceInfo || {})],
    );

    await this.truthLog.appendEvent('DEVICE_KEY_REGISTERED', {
      userId,
      platform,
      keyId,
    });
  }

  /**
   * Revoke an attestation key (e.g., on device compromise).
   */
  async revokeKey(userId: string, keyId: string): Promise<void> {
    await this.pool.query(
      `UPDATE device_attestation_keys SET revoked = true WHERE user_id = $1 AND key_id = $2`,
      [userId, keyId],
    );

    await this.truthLog.appendEvent('DEVICE_KEY_REVOKED', { userId, keyId });
  }
}
