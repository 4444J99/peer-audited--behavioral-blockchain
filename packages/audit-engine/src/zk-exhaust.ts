/**
 * ZK Exhaust Verifier
 *
 * Privacy-first verification of digital exhaust (texts, logs).
 * Allows proving a breach exists without revealing the sensitive raw payload.
 *
 * NOTE: This is NOT a real zero-knowledge proof. It is a keyed-HMAC commitment
 * scheme. A production ZKP (e.g. Circom/SnarkyJS) would be required to actually
 * prove a property without revealing the payload or trusting the holder of the secret.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export interface ZKProof {
  artifactHash: string;
  timestamp: string;
  senderPseudonym: string;
  challenge: string;
  signature: string;
}

const ZK_SECRET_ENV = "ZK_EXHAUST_SECRET";
export const ZK_PROOF_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

let ephemeralZkSecret: string | undefined;

function resolveZkSecret(): string {
  const configured = process.env[ZK_SECRET_ENV];
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `${ZK_SECRET_ENV} must be set in production (refusing to use an ephemeral per-process secret)`,
    );
  }

  if (!ephemeralZkSecret) {
    ephemeralZkSecret = randomBytes(32).toString("hex");
  }
  return ephemeralZkSecret;
}

export function generateZkChallenge(): string {
  return randomBytes(16).toString("hex");
}

export class ZKExhaustVerifier {
  public static pseudonymForPhone(senderPhone: string): string {
    return createHmac("sha256", resolveZkSecret())
      .update(senderPhone)
      .digest("hex");
  }

  public static generateProof(
    rawMessage: string,
    senderPhone: string,
    challenge: string = generateZkChallenge(),
  ): ZKProof {
    const secret = resolveZkSecret();
    const salt = randomBytes(16).toString("hex");
    const artifactHash = createHash("sha256")
      .update(rawMessage + salt)
      .digest("hex");
    const senderPseudonym = createHmac("sha256", secret)
      .update(senderPhone)
      .digest("hex");
    const timestamp = new Date().toISOString();

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

  public static verify(
    proof: ZKProof,
    knownTargetPseudonym: string,
    expectedChallenge?: string,
    maxAgeMs: number = ZK_PROOF_MAX_AGE_MS,
  ): boolean {
    if (
      !ZKExhaustVerifier.constantTimeEquals(
        proof.senderPseudonym,
        knownTargetPseudonym,
      )
    ) {
      return false;
    }

    const minted = Date.parse(proof.timestamp);
    if (!Number.isFinite(minted)) return false;

    const age = Date.now() - minted;
    if (age < -maxAgeMs || age > maxAgeMs) return false;

    if (
      expectedChallenge !== undefined &&
      !ZKExhaustVerifier.constantTimeEquals(proof.challenge, expectedChallenge)
    ) {
      return false;
    }

    const expectedSignature = ZKExhaustVerifier.computeSignature(
      resolveZkSecret(),
      proof.artifactHash,
      knownTargetPseudonym,
      proof.timestamp,
      proof.challenge,
    );

    return ZKExhaustVerifier.constantTimeEquals(
      proof.signature,
      expectedSignature,
    );
  }

  private static computeSignature(
    secret: string,
    artifactHash: string,
    pseudonym: string,
    timestamp: string,
    challenge: string,
  ): string {
    return createHmac("sha256", secret)
      .update(`${artifactHash}|${pseudonym}|${timestamp}|${challenge}`)
      .digest("hex");
  }

  private static constantTimeEquals(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
  }
}
