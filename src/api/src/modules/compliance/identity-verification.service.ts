import { Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import {
  IdentityProviderService,
  IdentityVerificationMode,
  IdentityProviderStatus,
  StartIdentityVerificationResult,
} from './identity-provider.service';

export type VerificationStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'REJECTED';

export interface UserComplianceStatus {
  userId: string;
  kycStatus: VerificationStatus;
  ageVerificationStatus: VerificationStatus;
  identityProvider: string | null;
  identityVerificationId: string | null;
  identityVerifiedAt: string | null;
  isKycVerified: boolean;
  isAgeVerified: boolean;
}

@Injectable()
export class IdentityVerificationService {
  constructor(
    private readonly pool: Pool,
    private readonly identityProvider: IdentityProviderService,
  ) {}

  async getUserComplianceStatus(userId: string): Promise<UserComplianceStatus> {
    const result = await this.pool.query(
      `SELECT id, kyc_status, age_verification_status, identity_provider,
              identity_verification_id, identity_verified_at
       FROM users
       WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return {
        userId,
        kycStatus: 'NOT_STARTED',
        ageVerificationStatus: 'NOT_STARTED',
        identityProvider: null,
        identityVerificationId: null,
        identityVerifiedAt: null,
        isKycVerified: false,
        isAgeVerified: false,
      };
    }

    const row = result.rows[0];
    const kycStatus = String(row.kyc_status || 'NOT_STARTED').toUpperCase() as VerificationStatus;
    const ageVerificationStatus = String(row.age_verification_status || 'NOT_STARTED').toUpperCase() as VerificationStatus;

    return {
      userId: row.id,
      kycStatus,
      ageVerificationStatus,
      identityProvider: row.identity_provider ?? null,
      identityVerificationId: row.identity_verification_id ?? null,
      identityVerifiedAt: row.identity_verified_at ? new Date(row.identity_verified_at).toISOString() : null,
      isKycVerified: kycStatus === 'VERIFIED',
      isAgeVerified: ageVerificationStatus === 'VERIFIED',
    };
  }

  async recordVerificationStatus(input: {
    userId: string;
    kycStatus?: VerificationStatus;
    ageVerificationStatus?: VerificationStatus;
    identityProvider?: string | null;
    identityVerificationId?: string | null;
    verifiedAt?: Date | null;
  }): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [input.userId];
    let index = 2;

    if (input.kycStatus) {
      updates.push(`kyc_status = $${index++}`);
      params.push(input.kycStatus);
    }
    if (input.ageVerificationStatus) {
      updates.push(`age_verification_status = $${index++}`);
      params.push(input.ageVerificationStatus);
    }
    if (input.identityProvider !== undefined) {
      updates.push(`identity_provider = $${index++}`);
      params.push(input.identityProvider);
    }
    if (input.identityVerificationId !== undefined) {
      updates.push(`identity_verification_id = $${index++}`);
      params.push(input.identityVerificationId);
    }
    if (input.verifiedAt !== undefined) {
      updates.push(`identity_verified_at = $${index++}`);
      params.push(input.verifiedAt);
    }

    if (updates.length === 0) return;

    await this.pool.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $1`,
      params,
    );
  }

  async startVerificationFlow(input: {
    userId: string;
    mode: IdentityVerificationMode;
    returnUrl?: string | null;
    refreshUrl?: string | null;
  }): Promise<StartIdentityVerificationResult & { userId: string }> {
    const userResult = await this.pool.query(
      `SELECT id, email FROM users WHERE id = $1`,
      [input.userId],
    );
    if (userResult.rows.length === 0) {
      throw new NotFoundException(`User ${input.userId} not found`);
    }

    const user = userResult.rows[0];
    const session = await this.identityProvider.startVerification({
      userId: input.userId,
      email: user.email ?? null,
      mode: input.mode,
      returnUrl: input.returnUrl,
      refreshUrl: input.refreshUrl,
    });

    const shouldSetKyc = input.mode === 'KYC_ONLY' || input.mode === 'KYC_AND_AGE';
    const shouldSetAge = input.mode === 'AGE_ONLY' || input.mode === 'KYC_AND_AGE';
    await this.recordVerificationStatus({
      userId: input.userId,
      ...(shouldSetKyc ? { kycStatus: 'PENDING' } : {}),
      ...(shouldSetAge ? { ageVerificationStatus: 'PENDING' } : {}),
      identityProvider: session.provider,
      identityVerificationId: session.verificationId,
      verifiedAt: null,
    });

    return { ...session, userId: input.userId };
  }

  async completeMockVerification(input: {
    userId: string;
    mode: IdentityVerificationMode;
    status: Exclude<IdentityProviderStatus, 'PENDING'>;
  }): Promise<UserComplianceStatus> {
    await this.applyProviderCompletion({
      provider: 'MOCK',
      verificationId: `mock_manual_${input.userId}`,
      mode: input.mode,
      status: input.status,
      userId: input.userId,
      raw: { source: 'mock-endpoint' },
    });

    return this.getUserComplianceStatus(input.userId);
  }

  async completeFromStripeWebhook(body: any): Promise<{ applied: boolean; reason?: string; userId?: string }> {
    const parsed = this.identityProvider.parseStripeIdentityWebhook(body);
    if (!parsed) {
      return { applied: false, reason: 'unsupported_or_invalid_event' };
    }

    await this.applyProviderCompletion(parsed);
    return { applied: true, userId: parsed.userId || undefined };
  }

  async applyProviderCompletion(input: {
    provider: 'MOCK' | 'STRIPE_IDENTITY';
    verificationId: string;
    mode: IdentityVerificationMode;
    status: IdentityProviderStatus;
    userId?: string | null;
    raw?: any;
  }): Promise<void> {
    const mappedStatus = this.mapProviderStatusToVerificationStatus(input.status);
    const verifiedAt = mappedStatus === 'VERIFIED' ? new Date() : null;

    let targetUserId = input.userId || null;
    if (!targetUserId) {
      const lookup = await this.pool.query(
        `SELECT id FROM users WHERE identity_verification_id = $1 LIMIT 1`,
        [input.verificationId],
      );
      if (lookup.rows.length === 0) {
        throw new NotFoundException(`No user found for verification ${input.verificationId}`);
      }
      targetUserId = lookup.rows[0].id;
    }

    const resolvedUserId = targetUserId as string;

    await this.recordVerificationStatus({
      userId: resolvedUserId,
      ...(input.mode === 'KYC_ONLY' || input.mode === 'KYC_AND_AGE' ? { kycStatus: mappedStatus } : {}),
      ...(input.mode === 'AGE_ONLY' || input.mode === 'KYC_AND_AGE' ? { ageVerificationStatus: mappedStatus } : {}),
      identityProvider: input.provider,
      identityVerificationId: input.verificationId,
      verifiedAt,
    });
  }

  private mapProviderStatusToVerificationStatus(status: IdentityProviderStatus): VerificationStatus {
    if (status === 'VERIFIED') return 'VERIFIED';
    if (status === 'REJECTED') return 'REJECTED';
    if (status === 'FAILED') return 'FAILED';
    return 'PENDING';
  }
}
