import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZKExhaustVerifier, generateZkChallenge, ZK_PROOF_MAX_AGE_MS } from "./zk-exhaust";
import crypto from "crypto";

describe("ZK Exhaust Verifier", () => {
  const mockSecret = "0123456789abcdef0123456789abcdef";

  beforeEach(() => {
    process.env.ZK_EXHAUST_SECRET = mockSecret;
  });

  it("generates a challenge string", () => {
    const challenge = generateZkChallenge();
    expect(typeof challenge).toBe("string");
    expect(challenge.length).toBe(32); // 16 bytes hex string
  });

  it("computes the same pseudonym for the same phone number", () => {
    const phone = "+15551234567";
    const p1 = ZKExhaustVerifier.pseudonymForPhone(phone);
    const p2 = ZKExhaustVerifier.pseudonymForPhone(phone);
    expect(p1).toBe(p2);
  });

  it("generates a valid proof that can be verified", () => {
    const rawMessage = "Hello World";
    const phone = "+15551234567";
    const challenge = generateZkChallenge();

    const proof = ZKExhaustVerifier.generateProof(rawMessage, phone, challenge);
    const targetPseudonym = ZKExhaustVerifier.pseudonymForPhone(phone);

    expect(proof.challenge).toBe(challenge);
    expect(proof.senderPseudonym).toBe(targetPseudonym);

    const isValid = ZKExhaustVerifier.verify(proof, targetPseudonym, challenge);
    expect(isValid).toBe(true);
  });

  it("fails verification if pseudonym doesn't match", () => {
    const rawMessage = "Hello World";
    const phone1 = "+15551234567";
    const phone2 = "+15559999999";
    const challenge = generateZkChallenge();

    const proof = ZKExhaustVerifier.generateProof(rawMessage, phone1, challenge);
    const wrongPseudonym = ZKExhaustVerifier.pseudonymForPhone(phone2);

    const isValid = ZKExhaustVerifier.verify(proof, wrongPseudonym, challenge);
    expect(isValid).toBe(false);
  });

  it("fails verification if challenge doesn't match", () => {
    const rawMessage = "Hello World";
    const phone = "+15551234567";
    const challenge1 = generateZkChallenge();
    const challenge2 = generateZkChallenge();

    const proof = ZKExhaustVerifier.generateProof(rawMessage, phone, challenge1);
    const targetPseudonym = ZKExhaustVerifier.pseudonymForPhone(phone);

    const isValid = ZKExhaustVerifier.verify(proof, targetPseudonym, challenge2);
    expect(isValid).toBe(false);
  });

  it("fails verification if signature is altered", () => {
    const rawMessage = "Hello World";
    const phone = "+15551234567";
    const challenge = generateZkChallenge();

    const proof = ZKExhaustVerifier.generateProof(rawMessage, phone, challenge);
    const targetPseudonym = ZKExhaustVerifier.pseudonymForPhone(phone);

    // Tamper with signature
    const tamperedProof = { ...proof, signature: proof.signature.replace("a", "b") };

    const isValid = ZKExhaustVerifier.verify(tamperedProof, targetPseudonym, challenge);
    expect(isValid).toBe(false);
  });

  it("fails verification if proof is too old", () => {
    const rawMessage = "Hello World";
    const phone = "+15551234567";
    const challenge = generateZkChallenge();

    const proof = ZKExhaustVerifier.generateProof(rawMessage, phone, challenge);
    const targetPseudonym = ZKExhaustVerifier.pseudonymForPhone(phone);

    // Mock Date.now to be much later
    const futureTime = Date.now() + ZK_PROOF_MAX_AGE_MS + 1000;
    vi.spyOn(Date, "now").mockImplementation(() => futureTime);

    const isValid = ZKExhaustVerifier.verify(proof, targetPseudonym, challenge);
    expect(isValid).toBe(false);

    vi.restoreAllMocks();
  });
});
