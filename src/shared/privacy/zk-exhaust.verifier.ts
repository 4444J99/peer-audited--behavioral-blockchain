import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * ZKExhaustVerifier
 *
 * Provides privacy-first verification of digital exhaust (texts, logs).
 * Allows proving a breach exists without revealing the sensitive raw payload.
 *
 * NOTE: This is NOT a real zero-knowledge proof. It is a keyed-HMAC commitment
 * scheme: the "signature" is unforgeable only to parties without the secret, and
 * the sender pseudonym is a salted HMAC rather than a bare hash. A production ZKP
 * (e.g. Circom/SnarkyJS) would be required to actually prove a property without
 * revealing the payload or trusting the holder of the secret.
 */

export interface ZKProof {
  artifactHash: string;
  timestamp: string;
  senderPseudonym: string;
  signature: string;
}

const ZK_SECRET_ENV = 'ZK_EXHAUST_SECRET';

// Per-process ephemeral key used only when ZK_EXHAUST_SECRET is not configured.
// This is generated from a CSPRNG (never a hardcoded value), so proofs minted and
// verified within the same process still work in dev/test without leaking a static
// secret. Production MUST set ZK_EXHAUST_SECRET so proofs remain verifiable across
// process restarts / multiple instances.
let ephemeralZkSecret: string | undefined;

function resolveZkSecret(): string {
  const configured = process.env[ZK_SECRET_ENV]; // allow-secret
  if (configured) {
    return configured;
  }
  if (!ephemeralZkSecret) {
    ephemeralZkSecret = randomBytes(32).toString('hex');
  }
  return ephemeralZkSecret;
}

export class ZKExhaustVerifier {
  /**
   * Derives a stable, salted pseudonym for a phone number. Uses a keyed HMAC so
   * the pseudonym is not a reversible sha256 of a low-entropy 10-digit number.
   */
  public static pseudonymForPhone(senderPhone: string): string {
    return createHmac('sha256', resolveZkSecret()).update(senderPhone).digest('hex');
  }

  /**
   * Generates a verifiable proof of a communication artifact locally.
   * In a production ZKP implementation, this would use SnarkyJS or Circom.
   */
  public static generateProof(rawMessage: string, senderPhone: string): ZKProof {
    const secret = resolveZkSecret();
    // High-entropy salt from a CSPRNG (never Math.random) so the artifact hash
    // cannot be precomputed/brute-forced against known plaintexts.
    const salt = randomBytes(16).toString('hex');
    const artifactHash = createHash('sha256').update(rawMessage + salt).digest('hex');
    const senderPseudonym = createHmac('sha256', secret).update(senderPhone).digest('hex');
    const timestamp = new Date().toISOString();

    // Keyed HMAC over the committed fields acts as the unforgeable "signature".
    const signature = createHmac('sha256', secret)
      .update(`${artifactHash}|${senderPseudonym}|${timestamp}`)
      .digest('hex');

    return {
      artifactHash,
      senderPseudonym,
      timestamp,
      signature,
    };
  }

  /**
   * Verifies the proof against the system's behavioral graph.
   */
  public static verify(proof: ZKProof, knownTargetPseudonym: string): boolean {
    // Check 1: Does the pseudonym match the target? (constant-time)
    if (!ZKExhaustVerifier.constantTimeEquals(proof.senderPseudonym, knownTargetPseudonym)) {
      return false;
    }

    // Check 2: Recompute and verify the HMAC signature over the committed fields.
    const expectedSignature = createHmac('sha256', resolveZkSecret())
      .update(`${proof.artifactHash}|${proof.senderPseudonym}|${proof.timestamp}`)
      .digest('hex');

    return ZKExhaustVerifier.constantTimeEquals(proof.signature, expectedSignature);
  }

  private static constantTimeEquals(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) {
      return false;
    }
    return timingSafeEqual(aBuf, bBuf);
  }
}
