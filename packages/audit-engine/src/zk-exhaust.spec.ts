import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  ZKExhaustVerifier,
  generateZkChallenge,
  ZK_PROOF_MAX_AGE_MS,
} from "./zk-exhaust";

describe("ZKExhaustVerifier", () => {
  const originalSecret = process.env.ZK_EXHAUST_SECRET;
  const mockSecret = "0123456789abcdef0123456789abcdef";

  beforeEach(() => {
    process.env.ZK_EXHAUST_SECRET = mockSecret;
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (originalSecret === undefined) {
      delete process.env.ZK_EXHAUST_SECRET;
    } else {
      process.env.ZK_EXHAUST_SECRET = originalSecret;
    }
  });

  it("generates a challenge string", () => {
    const challenge = generateZkChallenge();

    expect(typeof challenge).toBe("string");
    expect(challenge).toHaveLength(32);
  });

  it("computes the same pseudonym for the same phone number", () => {
    const phone = "+15551234567";

    expect(ZKExhaustVerifier.pseudonymForPhone(phone)).toBe(
      ZKExhaustVerifier.pseudonymForPhone(phone),
    );
  });

  it("generates a valid proof that can be verified", () => {
    const rawMessage = "Hello World";
    const phone = "+15551234567";
    const challenge = generateZkChallenge();

    const proof = ZKExhaustVerifier.generateProof(rawMessage, phone, challenge);
    const targetPseudonym = ZKExhaustVerifier.pseudonymForPhone(phone);

    expect(proof.challenge).toBe(challenge);
    expect(proof.senderPseudonym).toBe(targetPseudonym);
    expect(ZKExhaustVerifier.verify(proof, targetPseudonym, challenge)).toBe(
      true,
    );
  });

  it("fails verification if pseudonym does not match", () => {
    const challenge = generateZkChallenge();
    const proof = ZKExhaustVerifier.generateProof(
      "Hello World",
      "+15551234567",
      challenge,
    );
    const wrongPseudonym = ZKExhaustVerifier.pseudonymForPhone("+15559999999");

    expect(ZKExhaustVerifier.verify(proof, wrongPseudonym, challenge)).toBe(
      false,
    );
  });

  it("fails verification if challenge does not match", () => {
    const phone = "+15551234567";
    const challenge = generateZkChallenge();
    const proof = ZKExhaustVerifier.generateProof(
      "Hello World",
      phone,
      challenge,
    );
    const targetPseudonym = ZKExhaustVerifier.pseudonymForPhone(phone);

    expect(
      ZKExhaustVerifier.verify(
        proof,
        targetPseudonym,
        generateZkChallenge(),
      ),
    ).toBe(false);
  });

  it("fails verification if signature is altered", () => {
    const phone = "+15551234567";
    const challenge = generateZkChallenge();
    const proof = ZKExhaustVerifier.generateProof(
      "Hello World",
      phone,
      challenge,
    );
    const targetPseudonym = ZKExhaustVerifier.pseudonymForPhone(phone);
    const tamperedSignature =
      (proof.signature[0] === "a" ? "b" : "a") + proof.signature.slice(1);

    expect(
      ZKExhaustVerifier.verify(
        { ...proof, signature: tamperedSignature },
        targetPseudonym,
        challenge,
      ),
    ).toBe(false);
  });

  it("fails verification if proof is too old", () => {
    const phone = "+15551234567";
    const challenge = generateZkChallenge();
    const proof = ZKExhaustVerifier.generateProof(
      "Hello World",
      phone,
      challenge,
    );
    const targetPseudonym = ZKExhaustVerifier.pseudonymForPhone(phone);
    const futureTime = Date.now() + ZK_PROOF_MAX_AGE_MS + 1000;

    vi.spyOn(Date, "now").mockReturnValue(futureTime);

    expect(ZKExhaustVerifier.verify(proof, targetPseudonym, challenge)).toBe(
      false,
    );
  });
});
