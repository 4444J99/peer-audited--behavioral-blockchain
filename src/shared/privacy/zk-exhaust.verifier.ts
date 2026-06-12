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
  // Verifier-supplied nonce/challenge this proof was minted against. Binds the
  // proof to a single verification session so a captured proof cannot be replayed
  // against a different challenge.
  challenge: string;
  signature: string;
}

const ZK_SECRET_ENV = 'ZK_EXHAUST_SECRET';

// A minted proof is only accepted within this window of its embedded timestamp.
// Beyond it the proof is considered stale and rejected, so a captured proof cannot
// be replayed indefinitely.
export const ZK_PROOF_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

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
  // Production startup guard: a per-process ephemeral secret silently breaks
  // verification across instances/restarts. Fail closed rather than mint proofs
  // that cannot be verified elsewhere.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${ZK_SECRET_ENV} must be set in production (refusing to use an ephemeral per-process secret)`,
    );
  }
  const secret = ephemeralZkSecret ?? randomBytes(32).toString('hex');
  ephemeralZkSecret = secret;
  return secret;
}

/** Generates a fresh, high-entropy verifier challenge/nonce. */
export function generateZkChallenge(): string {
  return randomBytes(16).toString('hex');
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
   *
   * `challenge` is a verifier-supplied nonce that binds the proof to a single
   * verification session (defends against replay of a captured proof). Callers
   * that do not yet supply one get a freshly generated nonce; the resulting proof
   * is only verifiable against that same challenge.
   */
  public static generateProof(
    rawMessage: string,
    senderPhone: string,
    challenge: string = generateZkChallenge(),
  ): ZKProof {
    const secret = resolveZkSecret();
    // High-entropy salt from a CSPRNG (never Math.random) so the artifact hash
    // cannot be precomputed/brute-forced against known plaintexts.
    const salt = randomBytes(16).toString('hex');
    const artifactHash = createHash('sha256').update(rawMessage + salt).digest('hex');
    const senderPseudonym = createHmac('sha256', secret).update(senderPhone).digest('hex');
    const timestamp = new Date().toISOString();

    // Keyed HMAC over the committed fields (incl. the verifier challenge) acts as
    // the unforgeable "signature".
    const signature = ZKExhaustVerifier.computeSignature(
      secret,
      artifactHash,
      senderPseudonym,
      timestamp,
      challenge,
    );

    return {
      artifactHash,
      senderPseudonym,
      timestamp,
      challenge,
      signature,
    };
  }

  /**
   * Verifies the proof against the system's behavioral graph.
   *
   * `knownTargetPseudonym` is the verifier's claim context: the signature is
   * re-derived against it (not against the value carried in the proof) so a proof
   * can only prove something about the pseudonym the verifier is actually asking
   * about. `expectedChallenge`, when supplied, must equal the challenge the proof
   * was minted against (single-use replay defense). The embedded `timestamp` must
   * be recent (`maxAgeMs`) so a captured proof cannot be replayed indefinitely.
   */
  public static verify(
    proof: ZKProof,
    knownTargetPseudonym: string,
    expectedChallenge?: string,
    maxAgeMs: number = ZK_PROOF_MAX_AGE_MS,
  ): boolean {
    // Check 1: Does the pseudonym match the target the verifier is asking about?
    if (!ZKExhaustVerifier.constantTimeEquals(proof.senderPseudonym, knownTargetPseudonym)) {
      return false;
    }

    // Check 2: Reject stale proofs (timestamp expiry → no indefinite replay).
    const minted = Date.parse(proof.timestamp);
    if (!Number.isFinite(minted)) {
      return false;
    }
    const age = Date.now() - minted;
    if (age < -maxAgeMs || age > maxAgeMs) {
      return false;
    }

    // Check 3: Enforce the verifier's challenge/nonce if one was issued, so a
    // captured proof cannot be replayed against a different challenge.
    if (expectedChallenge !== undefined &&
        !ZKExhaustVerifier.constantTimeEquals(proof.challenge, expectedChallenge)) {
      return false;
    }

    // Check 4: Recompute the HMAC over the committed fields. The signature is bound
    // to the verifier's claimed target pseudonym AND the challenge carried by the
    // proof, so it cannot be lifted onto a different claim/session.
    const expectedSignature = ZKExhaustVerifier.computeSignature(
      resolveZkSecret(),
      proof.artifactHash,
      knownTargetPseudonym,
      proof.timestamp,
      proof.challenge,
    );

    return ZKExhaustVerifier.constantTimeEquals(proof.signature, expectedSignature);
  }

  private static computeSignature(
    secret: string,
    artifactHash: string,
    pseudonym: string,
    timestamp: string,
    challenge: string,
  ): string {
    return createHmac('sha256', secret)
      .update(`${artifactHash}|${pseudonym}|${timestamp}|${challenge}`)
      .digest('hex');
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
