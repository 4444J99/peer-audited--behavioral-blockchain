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
    // PRV13: in production a mock/placeholder API key must hard-fail. A config where
    // the webhook secret is real but the API key is the mock default yields
    // inconsistent verification and silent KYC failure. Fail closed at construction.
    if (process.env.NODE_ENV === 'production' && apiKey === 'sk_test_mock_key') {
      throw new Error('STRIPE_SECRET_KEY must be a real key in production (mock key is not allowed)');
    }
    this.stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });
  }

  get isAvailable(): boolean {
    const key = process.env.STRIPE_SECRET_KEY;
    return !!key && key !== 'sk_test_mock_key';
  }

  private get webhookSecret(): string {
    return process.env.STRIPE_IDENTITY_WEBHOOK_SECRET || ''; // allow-secret
  }

  /**
   * Verify the Stripe-Signature against the raw request body using the endpoint's
   * signing secret. Returns the verified Stripe.Event on success. Throws if the
   * webhook secret is unconfigured, the signature header is missing, or verification
   * fails — callers must NOT process unverified payloads.
   */
  constructVerifiedEvent(rawBody: Buffer | string | undefined, signature: string | undefined): Stripe.Event {
    if (!this.webhookSecret) {
      throw new Error('Stripe Identity webhook secret is not configured');
    }
    if (!signature) {
      throw new Error('Missing Stripe-Signature header');
    }
    if (rawBody == null) {
      throw new Error('Missing raw request body for signature verification');
    }
    return this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
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

  /**
   * Parse a Stripe Identity webhook event into a completion result.
   * IMPORTANT: `body` must be a signature-VERIFIED Stripe.Event (see
   * constructVerifiedEvent). Because Stripe signs the entire payload, the
   * verification session metadata (styxUserId / verificationMode) on a verified
   * event is authentic — it originates from the session we created, not from an
   * unverified client field.
   */
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
  private readonly logger = new Logger(IdentityProviderService.name);

  constructor(
    private readonly mockAdapter: MockIdentityProviderAdapter,
    private readonly stripeAdapter: StripeIdentityProviderAdapter,
  ) {}

  private get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private get configuredProvider(): 'MOCK' | 'STRIPE_IDENTITY' {
    const raw = String(process.env.STYX_IDENTITY_PROVIDER || '').toUpperCase();
    if (raw === 'STRIPE' || raw === 'STRIPE_IDENTITY') return 'STRIPE_IDENTITY';
    if (raw === 'MOCK') return 'MOCK';
    // No explicit selection: production MUST use the real provider; only dev/test
    // may fall back to the mock adapter.
    return this.isProduction ? 'STRIPE_IDENTITY' : 'MOCK';
  }

  async startVerification(input: StartIdentityVerificationInput): Promise<StartIdentityVerificationResult> {
    // In production the mock provider must never be usable — it flips users to
    // VERIFIED with no real proof of identity/age.
    if (this.isProduction && this.configuredProvider === 'MOCK') {
      throw new Error('Mock identity provider is disabled in production; configure STYX_IDENTITY_PROVIDER=STRIPE');
    }

    if (this.configuredProvider === 'STRIPE_IDENTITY') {
      try {
        return await this.stripeAdapter.start(input);
      } catch (err) {
        // Never silently downgrade to the mock provider in production: a Stripe
        // outage/misconfiguration must surface rather than grant unverified access.
        if (this.isProduction) {
          this.logger.error(`Stripe Identity verification failed in production: ${(err as Error)?.message}`);
          throw err;
        }
        // Dev/test only: fall through to mock for local continuity.
        this.logger.warn(`Stripe Identity unavailable; falling back to mock provider (non-production): ${(err as Error)?.message}`);
      }
    }

    return this.mockAdapter.start(input);
  }

  /**
   * Verify the Stripe-Signature on a raw webhook request and parse the resulting
   * (authentic) event. Throws when the signature/secret is missing or invalid so the
   * caller rejects forged events.
   */
  verifyAndParseStripeWebhook(
    rawBody: Buffer | string | undefined,
    signature: string | undefined,
  ): IdentityProviderCompletionResult | null {
    const event = this.stripeAdapter.constructVerifiedEvent(rawBody, signature);
    return this.stripeAdapter.parseWebhookEvent(event);
  }

  /**
   * PRV12: the legacy signature-less webhook parser is DISABLED. It previously
   * parsed an UNVERIFIED payload and could flip a user to VERIFIED from a forged
   * event (a KYC-bypass footgun). It now hard-throws so the only reachable path is
   * verifyAndParseStripeWebhook, which validates the Stripe-Signature first.
   * @deprecated Use verifyAndParseStripeWebhook. Retained only as a tripwire.
   */
  parseStripeIdentityWebhook(_body: any): IdentityProviderCompletionResult | null {
    throw new Error(
      'parseStripeIdentityWebhook is disabled (PRV12): unverified Stripe Identity payloads must not be parsed. Use verifyAndParseStripeWebhook.',
    );
  }
}
