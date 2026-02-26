import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';

export type IdentityVerificationMode = 'KYC_ONLY' | 'AGE_ONLY' | 'KYC_AND_AGE';
export type IdentityProviderStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'REJECTED';

export interface StartIdentityVerificationInput {
  userId: string;
  email?: string | null;
  mode: IdentityVerificationMode;
  returnUrl?: string | null;
  refreshUrl?: string | null;
}

export interface StartIdentityVerificationResult {
  provider: 'MOCK' | 'STRIPE_IDENTITY';
  verificationId: string;
  status: IdentityProviderStatus;
  clientSecret?: string | null;
  hostedUrl?: string | null;
}

export interface IdentityProviderCompletionResult {
  provider: 'MOCK' | 'STRIPE_IDENTITY';
  verificationId: string;
  mode: IdentityVerificationMode;
  status: IdentityProviderStatus;
  userId?: string | null;
  raw?: any;
}

interface IdentityProviderAdapter {
  providerName: 'MOCK' | 'STRIPE_IDENTITY';
  start(input: StartIdentityVerificationInput): Promise<StartIdentityVerificationResult>;
}

@Injectable()
export class MockIdentityProviderAdapter implements IdentityProviderAdapter {
  providerName: 'MOCK' = 'MOCK';

  async start(input: StartIdentityVerificationInput): Promise<StartIdentityVerificationResult> {
    return {
      provider: 'MOCK',
      verificationId: `ivs_mock_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      status: 'PENDING',
      hostedUrl: `${input.returnUrl || 'http://localhost:3001'}/settings?mockIdentity=1`,
      clientSecret: null,
    };
  }
}

@Injectable()
export class StripeIdentityProviderAdapter implements IdentityProviderAdapter {
  providerName: 'STRIPE_IDENTITY' = 'STRIPE_IDENTITY';
  private readonly logger = new Logger(StripeIdentityProviderAdapter.name);
  private readonly stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key'; // allow-secret
    this.stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });
  }

  get isAvailable(): boolean {
    const key = process.env.STRIPE_SECRET_KEY;
    return !!key && key !== 'sk_test_mock_key';
  }

  async start(input: StartIdentityVerificationInput): Promise<StartIdentityVerificationResult> {
    if (!this.isAvailable) {
      this.logger.warn('Stripe Identity adapter requested without a real STRIPE_SECRET_KEY; use mock provider or configure Stripe.');
      throw new Error('Stripe Identity provider is not configured');
    }

    const session = await this.stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        styxUserId: input.userId,
        verificationMode: input.mode,
      },
      options: {
        document: {
          require_id_number: false,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      return_url: input.returnUrl || undefined,
    } as any);

    return {
      provider: 'STRIPE_IDENTITY',
      verificationId: session.id,
      status: 'PENDING',
      clientSecret: (session as any).client_secret ?? null,
      hostedUrl: (session as any).url ?? null,
    };
  }

  parseWebhookEvent(body: any): IdentityProviderCompletionResult | null {
    const eventType = String(body?.type || '');
    const object = body?.data?.object;
    if (!object?.id || !eventType.startsWith('identity.verification_session.')) {
      return null;
    }

    const mode = (String(object?.metadata?.verificationMode || 'KYC_AND_AGE').toUpperCase() as IdentityVerificationMode);
    const userId = object?.metadata?.styxUserId ? String(object.metadata.styxUserId) : null;

    let status: IdentityProviderStatus = 'PENDING';
    if (eventType.endsWith('.verified')) status = 'VERIFIED';
    if (eventType.endsWith('.requires_input')) status = 'FAILED';
    if (eventType.endsWith('.canceled')) status = 'REJECTED';

    return {
      provider: 'STRIPE_IDENTITY',
      verificationId: String(object.id),
      mode,
      status,
      userId,
      raw: body,
    };
  }
}

@Injectable()
export class IdentityProviderService {
  constructor(
    private readonly mockAdapter: MockIdentityProviderAdapter,
    private readonly stripeAdapter: StripeIdentityProviderAdapter,
  ) {}

  private get configuredProvider(): 'MOCK' | 'STRIPE_IDENTITY' {
    const raw = String(process.env.STYX_IDENTITY_PROVIDER || 'mock').toUpperCase();
    return raw === 'STRIPE' || raw === 'STRIPE_IDENTITY' ? 'STRIPE_IDENTITY' : 'MOCK';
  }

  async startVerification(input: StartIdentityVerificationInput): Promise<StartIdentityVerificationResult> {
    if (this.configuredProvider === 'STRIPE_IDENTITY') {
      try {
        return await this.stripeAdapter.start(input);
      } catch {
        // fall through to mock for local/dev continuity
      }
    }

    return this.mockAdapter.start(input);
  }

  parseStripeIdentityWebhook(body: any): IdentityProviderCompletionResult | null {
    return this.stripeAdapter.parseWebhookEvent(body);
  }
}
