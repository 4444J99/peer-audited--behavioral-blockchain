import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import { TruthLogService } from '../ledger/truth-log.service';

export type AttestationPlatform = 'ios' | 'android';

export interface AppAttestRegistration {
  /**
   * base64 key identifier from DCAppAttestService.generateKey — by Apple's
   * definition this is the SHA-256 of the credential public key.
   */
  keyId: string;
  /**
   * base64 CBOR attestation object from DCAppAttestService.attestKey.
   */
  attestationObject: string;
  /**
   * The server-issued one-time challenge the client hashed into clientDataHash.
   */
  challenge: string;
}

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
  /**
   * base64 DER ECDSA signature over SHA256(authenticatorData || SHA256(clientDataJSON))
   */
  signature: string;
}

export interface PlayIntegrityVerdict {
  /**
   * Play Integrity API: signed JWS token (standard/classic request)
   */
  tokenResult: string;
  /**
   * Play Integrity API: requestPackageName the client claims
   */
  requestPackageName: string;
}

export interface DeviceAttestationResult {
  verified: boolean;
  platform: AttestationPlatform;
  deviceIntegrity: 'STRONG' | 'WEAK' | 'NONE' | 'DEV_BYPASS';
  reason?: string;
  riskFlags: string[];
}

// ---------------------------------------------------------------------------
// Strict CBOR decoder (subset needed for App Attest attestation objects).
// No indefinite lengths, no tags, no floats, text-string map keys only.
// ---------------------------------------------------------------------------

class CborDecodeError extends Error {}

const MAX_CBOR_DEPTH = 16;

function readCborUint(buf: Buffer, offset: number, byteLength: number): number {
  if (offset + byteLength > buf.length) {
    throw new CborDecodeError('truncated CBOR item');
  }
  if (byteLength === 8) {
    const big = buf.readBigUInt64BE(offset);
    if (big > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new CborDecodeError('CBOR integer exceeds safe range');
    }
    return Number(big);
  }
  return buf.readUIntBE(offset, byteLength);
}

function decodeCborItem(
  buf: Buffer,
  offset: number,
  depth: number,
): { value: unknown; offset: number } {
  if (depth > MAX_CBOR_DEPTH) {
    throw new CborDecodeError('CBOR nesting too deep');
  }
  if (offset >= buf.length) {
    throw new CborDecodeError('truncated CBOR item');
  }
  const initial = buf[offset];
  const major = initial >> 5;
  const additional = initial & 0x1f;
  if (additional === 31) {
    throw new CborDecodeError('indefinite-length CBOR items are not allowed');
  }
  if (additional > 27) {
    throw new CborDecodeError('reserved CBOR additional-info value');
  }

  let cursor = offset + 1;
  let argument: number;
  if (additional < 24) {
    argument = additional;
  } else {
    const byteLength = 1 << (additional - 24);
    argument = readCborUint(buf, cursor, byteLength);
    cursor += byteLength;
  }

  switch (major) {
    case 0:
      return { value: argument, offset: cursor };
    case 1:
      return { value: -1 - argument, offset: cursor };
    case 2: {
      if (cursor + argument > buf.length) {
        throw new CborDecodeError('truncated CBOR byte string');
      }
      return {
        value: Buffer.from(buf.subarray(cursor, cursor + argument)),
        offset: cursor + argument,
      };
    }
    case 3: {
      if (cursor + argument > buf.length) {
        throw new CborDecodeError('truncated CBOR text string');
      }
      return {
        value: buf.subarray(cursor, cursor + argument).toString('utf8'),
        offset: cursor + argument,
      };
    }
    case 4: {
      const items: unknown[] = [];
      for (let i = 0; i < argument; i++) {
        const item = decodeCborItem(buf, cursor, depth + 1);
        items.push(item.value);
        cursor = item.offset;
      }
      return { value: items, offset: cursor };
    }
    case 5: {
      const map: Record<string, unknown> = {};
      for (let i = 0; i < argument; i++) {
        const key = decodeCborItem(buf, cursor, depth + 1);
        if (typeof key.value !== 'string') {
          throw new CborDecodeError('only text-string CBOR map keys are supported');
        }
        if (Object.prototype.hasOwnProperty.call(map, key.value)) {
          throw new CborDecodeError('duplicate CBOR map key');
        }
        cursor = key.offset;
        const value = decodeCborItem(buf, cursor, depth + 1);
        map[key.value] = value.value;
        cursor = value.offset;
      }
      return { value: map, offset: cursor };
    }
    default:
      throw new CborDecodeError(`unsupported CBOR major type ${major}`);
  }
}

function decodeCbor(buf: Buffer): unknown {
  const { value, offset } = decodeCborItem(buf, 0, 0);
  if (offset !== buf.length) {
    throw new CborDecodeError('trailing bytes after CBOR item');
  }
  return value;
}

// ---------------------------------------------------------------------------
// Minimal DER TLV reader — enough to pull the Apple App Attest nonce
// extension (OID 1.2.840.113635.100.8.2) out of a credential certificate.
// ---------------------------------------------------------------------------

interface DerTlv {
  tag: number;
  contentStart: number;
  contentEnd: number;
  end: number;
}

function readDerTlv(buf: Buffer, offset: number): DerTlv {
  if (offset + 2 > buf.length) {
    throw new Error('truncated DER structure');
  }
  const tag = buf[offset];
  if ((tag & 0x1f) === 0x1f) {
    throw new Error('multi-byte DER tags are not supported');
  }
  const lengthByte = buf[offset + 1];
  let contentStart = offset + 2;
  let length: number;
  if (lengthByte < 0x80) {
    length = lengthByte;
  } else {
    const numBytes = lengthByte & 0x7f;
    if (numBytes === 0 || numBytes > 2) {
      throw new Error('unsupported DER length encoding');
    }
    if (contentStart + numBytes > buf.length) {
      throw new Error('truncated DER length');
    }
    length = buf.readUIntBE(contentStart, numBytes);
    contentStart += numBytes;
  }
  const contentEnd = contentStart + length;
  if (contentEnd > buf.length) {
    throw new Error('DER content exceeds buffer');
  }
  return { tag, contentStart, contentEnd, end: contentEnd };
}

// DER encoding of OID 1.2.840.113635.100.8.2 (Apple App Attest nonce extension)
const APPLE_NONCE_OID = Buffer.from('06092a864886f763640802', 'hex');

/**
 * Extension value structure: OCTET STRING { SEQUENCE { [1] { OCTET STRING nonce } } }
 */
function extractAppleNonce(cert: crypto.X509Certificate): Buffer | null {
  const raw = cert.raw;
  let searchFrom = 0;
  while (searchFrom < raw.length) {
    const idx = raw.indexOf(APPLE_NONCE_OID, searchFrom);
    if (idx === -1) {
      return null;
    }
    try {
      let offset = idx + APPLE_NONCE_OID.length;
      // Optional `critical BOOLEAN` between the OID and the extnValue
      if (raw[offset] === 0x01) {
        offset = readDerTlv(raw, offset).end;
      }
      const extnValue = readDerTlv(raw, offset);
      if (extnValue.tag !== 0x04) throw new Error('expected OCTET STRING extnValue');
      const seq = readDerTlv(raw, extnValue.contentStart);
      if (seq.tag !== 0x30) throw new Error('expected SEQUENCE');
      const ctx = readDerTlv(raw, seq.contentStart);
      if (ctx.tag !== 0xa1) throw new Error('expected [1] context tag');
      const octet = readDerTlv(raw, ctx.contentStart);
      if (octet.tag !== 0x04) throw new Error('expected OCTET STRING nonce');
      return Buffer.from(raw.subarray(octet.contentStart, octet.contentEnd));
    } catch {
      // The OID byte pattern matched unrelated bytes — keep scanning.
      searchFrom = idx + 1;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function sha256(data: Buffer | string): Buffer {
  return crypto.createHash('sha256').update(data).digest();
}

function constantTimeEquals(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

/**
 * 0x04 || X || Y for a P-256 key — the byte sequence Apple hashes to derive keyId.
 */
function uncompressedEcPoint(publicKey: crypto.KeyObject): Buffer {
  const jwk = publicKey.export({ format: 'jwk' }) as crypto.JsonWebKey;
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
    throw new Error('credential key is not an EC P-256 key');
  }
  return Buffer.concat([
    Buffer.from([0x04]),
    Buffer.from(jwk.x, 'base64url'),
    Buffer.from(jwk.y, 'base64url'),
  ]);
}

const APP_ATTEST_AAGUID_PROD = Buffer.concat([
  Buffer.from('appattest', 'ascii'),
  Buffer.alloc(7),
]);
const APP_ATTEST_AAGUID_DEV = Buffer.from('appattestdevelop', 'ascii');

// authData layout: rpIdHash(32) flags(1) counter(4) aaguid(16) credIdLen(2) credId(32)
const ATTESTATION_AUTH_DATA_MIN_LENGTH = 87;
const ASSERTION_AUTH_DATA_MIN_LENGTH = 37;
const FLAG_USER_PRESENT = 0x01;
const FLAG_ATTESTED_CREDENTIAL_DATA = 0x40;

const DEFAULT_PLAY_INTEGRITY_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/cloud-integrity@system.gserviceaccount.com';
const JWKS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const JWKS_REFETCH_COOLDOWN_MS = 60 * 1000;
const PLAY_INTEGRITY_MAX_AGE_MS = 15 * 60 * 1000;

/**
 * Server-side device attestation verification.
 *
 * iOS — Apple App Attest:
 *  - Registration parses the CBOR attestation object, validates the certificate
 *    chain against the Apple App Attest root CA (APPLE_APP_ATTEST_ROOT_CA_PEM),
 *    checks the nonce binding (SHA256(authData || SHA256(challenge)) against the
 *    credential certificate's 1.2.840.113635.100.8.2 extension), verifies
 *    rpIdHash == SHA256(APPLE_APP_ATTEST_APP_ID), aaguid, initial counter and
 *    keyId == SHA256(credential public key), then stores the REAL public key.
 *  - Assertions are verified with crypto.verify against the stored public key
 *    with strict counter monotonicity (replays are rejected, not downgraded).
 *
 * Android — Google Play Integrity (standard JWS flow):
 *  - The token is verified as a JWS: signing key fetched (and cached) from
 *    GOOGLE_PLAY_INTEGRITY_JWKS_URL, signature + exp + package name
 *    (ANDROID_PACKAGE_NAME) checked BEFORE any verdict field is trusted.
 *
 * Fail-closed: missing configuration throws at verification time. The only
 * exception is non-production with DEVICE_ATTESTATION_DEV_BYPASS=true, which
 * returns SIMULATED verdicts labeled deviceIntegrity:'DEV_BYPASS' — never
 * 'STRONG' — and performs no writes. The bypass is ignored in production.
 */
@Injectable()
export class DeviceAttestationService {
  private readonly logger = new Logger(DeviceAttestationService.name);

  private jwksCache: {
    url: string;
    fetchedAt: number;
    keys: Record<string, unknown>[];
  } | null = null;

  constructor(
    private readonly pool: Pool,
    private readonly truthLog: TruthLogService,
  ) {}

  // -------------------------------------------------------------------------
  // Configuration / fail-closed handling
  // -------------------------------------------------------------------------

  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private devBypassAllowed(): boolean {
    // The bypass is only honored OUTSIDE production; in production a missing
    // config always throws regardless of the flag.
    return !this.isProduction() && process.env.DEVICE_ATTESTATION_DEV_BYPASS === 'true';
  }

  private async handleMissingConfig(
    platform: AttestationPlatform,
    missingVar: string,
  ): Promise<DeviceAttestationResult> {
    if (this.devBypassAllowed()) {
      this.logger.warn(
        `Device attestation dev bypass active (${missingVar} unset) — returning SIMULATED verdict`,
      );
      await this.truthLog.appendEvent('DEVICE_ATTESTATION_DEV_BYPASS', {
        platform,
        missingVar,
      });
      return {
        verified: true,
        platform,
        deviceIntegrity: 'DEV_BYPASS',
        reason: `Simulated verdict: ${missingVar} is not configured and DEVICE_ATTESTATION_DEV_BYPASS=true`,
        riskFlags: ['dev_bypass'],
      };
    }
    throw new ServiceUnavailableException(
      `Device attestation is not configured: ${missingVar} is required`,
    );
  }

  // -------------------------------------------------------------------------
  // iOS — App Attest key registration (attestation object verification)
  // -------------------------------------------------------------------------

  /**
   * Verify an App Attest attestation object and register the credential key.
   * Only a key that passes full cryptographic verification is ever stored.
   */
  async registerIosAttestedKey(
    userId: string,
    registration: AppAttestRegistration,
  ): Promise<DeviceAttestationResult> {
    if (
      !registration ||
      !registration.keyId ||
      !registration.attestationObject ||
      !registration.challenge
    ) {
      throw new BadRequestException('Incomplete App Attest registration');
    }

    const appId = process.env.APPLE_APP_ATTEST_APP_ID;
    if (!appId) {
      return this.handleMissingConfig('ios', 'APPLE_APP_ATTEST_APP_ID');
    }
    const rootCaPem = process.env.APPLE_APP_ATTEST_ROOT_CA_PEM;
    if (!rootCaPem) {
      return this.handleMissingConfig('ios', 'APPLE_APP_ATTEST_ROOT_CA_PEM');
    }

    let rootCa: crypto.X509Certificate;
    try {
      rootCa = new crypto.X509Certificate(rootCaPem);
    } catch {
      // Misconfiguration, not client error — fail closed.
      throw new ServiceUnavailableException(
        'APPLE_APP_ATTEST_ROOT_CA_PEM is not a valid PEM certificate',
      );
    }

    const riskFlags: string[] = [];

    let decoded: unknown;
    try {
      decoded = decodeCbor(Buffer.from(registration.attestationObject, 'base64'));
    } catch {
      return this.rejectIos(userId, registration.keyId, 'Attestation object is not valid CBOR', [
        'malformed_attestation',
      ]);
    }

    const attestation = decoded as Record<string, unknown>;
    if (
      typeof attestation !== 'object' ||
      attestation === null ||
      attestation.fmt !== 'apple-appattest'
    ) {
      return this.rejectIos(
        userId,
        registration.keyId,
        'Attestation format is not apple-appattest',
        ['malformed_attestation'],
      );
    }

    const attStmt = attestation.attStmt as Record<string, unknown> | undefined;
    const x5c = attStmt?.x5c;
    const authData = attestation.authData;
    if (
      !Array.isArray(x5c) ||
      x5c.length < 2 ||
      !x5c.every((c) => Buffer.isBuffer(c)) ||
      !Buffer.isBuffer(authData)
    ) {
      return this.rejectIos(
        userId,
        registration.keyId,
        'Attestation statement is missing certificate chain or authenticator data',
        ['malformed_attestation'],
      );
    }

    let certs: crypto.X509Certificate[];
    try {
      certs = (x5c as Buffer[]).map((der) => new crypto.X509Certificate(der));
    } catch {
      return this.rejectIos(userId, registration.keyId, 'Certificate parse failure', [
        'invalid_certificate_chain',
      ]);
    }

    const chainError = this.verifyCertificateChain(certs, rootCa);
    if (chainError) {
      return this.rejectIos(userId, registration.keyId, `Certificate chain invalid: ${chainError}`, [
        'invalid_certificate_chain',
      ]);
    }

    if (authData.length < ATTESTATION_AUTH_DATA_MIN_LENGTH) {
      return this.rejectIos(userId, registration.keyId, 'Authenticator data too short', [
        'malformed_attestation',
      ]);
    }

    const expectedRpIdHash = sha256(Buffer.from(appId, 'utf8'));
    if (!constantTimeEquals(authData.subarray(0, 32), expectedRpIdHash)) {
      return this.rejectIos(
        userId,
        registration.keyId,
        'rpIdHash does not match APPLE_APP_ATTEST_APP_ID',
        ['rp_id_mismatch'],
      );
    }

    const flags = authData[32];
    if (!(flags & FLAG_ATTESTED_CREDENTIAL_DATA)) {
      return this.rejectIos(userId, registration.keyId, 'Attested credential data flag not set', [
        'malformed_attestation',
      ]);
    }

    const counter = authData.readUInt32BE(33);
    if (counter !== 0) {
      return this.rejectIos(userId, registration.keyId, 'Initial attestation counter must be 0', [
        'nonzero_initial_counter',
      ]);
    }

    const aaguid = authData.subarray(37, 53);
    if (!aaguid.equals(APP_ATTEST_AAGUID_PROD)) {
      if (aaguid.equals(APP_ATTEST_AAGUID_DEV)) {
        if (this.isProduction()) {
          return this.rejectIos(
            userId,
            registration.keyId,
            'Development aaguid is not accepted in production',
            ['development_aaguid'],
          );
        }
        riskFlags.push('development_aaguid');
      } else {
        return this.rejectIos(userId, registration.keyId, 'Unrecognized App Attest aaguid', [
          'malformed_attestation',
        ]);
      }
    }

    const credIdLength = authData.readUInt16BE(53);
    if (credIdLength !== 32 || authData.length < 55 + credIdLength) {
      return this.rejectIos(userId, registration.keyId, 'Malformed credential ID', [
        'malformed_attestation',
      ]);
    }
    const credId = authData.subarray(55, 55 + credIdLength);

    const keyIdBytes = Buffer.from(registration.keyId, 'base64');
    if (keyIdBytes.length !== 32 || !credId.equals(keyIdBytes)) {
      return this.rejectIos(
        userId,
        registration.keyId,
        'Credential ID does not match the supplied keyId',
        ['key_id_mismatch'],
      );
    }

    const credCert = certs[0];
    let publicKeyPoint: Buffer;
    try {
      publicKeyPoint = uncompressedEcPoint(credCert.publicKey);
    } catch {
      return this.rejectIos(userId, registration.keyId, 'Credential key is not an EC P-256 key', [
        'unsupported_key_type',
      ]);
    }

    if (!constantTimeEquals(sha256(publicKeyPoint), keyIdBytes)) {
      return this.rejectIos(
        userId,
        registration.keyId,
        'keyId is not the SHA-256 of the attested public key',
        ['key_id_mismatch'],
      );
    }

    // Nonce binding: nonce = SHA256(authData || SHA256(challenge)) must appear
    // in the credential certificate's Apple nonce extension. This proves the
    // certificate was minted for exactly this authData + challenge pair.
    const clientDataHash = sha256(Buffer.from(registration.challenge, 'utf8'));
    const expectedNonce = sha256(Buffer.concat([authData, clientDataHash]));
    const actualNonce = extractAppleNonce(credCert);
    if (!actualNonce || !constantTimeEquals(actualNonce, expectedNonce)) {
      return this.rejectIos(
        userId,
        registration.keyId,
        'Attestation nonce does not match the challenge binding',
        ['nonce_mismatch'],
      );
    }

    const publicKeyPem = credCert.publicKey.export({ type: 'spki', format: 'pem' }).toString();

    // sign_count deliberately NOT reset on conflict: replaying a captured
    // registration for an existing key must not re-enable assertion replay.
    await this.pool.query(
      `INSERT INTO device_attestation_keys (user_id, platform, key_id, public_key, device_info)
       VALUES ($1, 'ios', $2, $3, $4)
       ON CONFLICT (user_id, platform, key_id) DO UPDATE SET
         public_key = EXCLUDED.public_key,
         device_info = EXCLUDED.device_info,
         revoked = false`,
      [
        userId,
        registration.keyId,
        publicKeyPem,
        JSON.stringify({
          aaguid: aaguid.equals(APP_ATTEST_AAGUID_DEV) ? 'appattestdevelop' : 'appattest',
        }),
      ],
    );

    const deviceIntegrity: DeviceAttestationResult['deviceIntegrity'] = riskFlags.includes(
      'development_aaguid',
    )
      ? 'WEAK'
      : 'STRONG';

    await this.truthLog.appendEvent('DEVICE_KEY_REGISTERED', {
      userId,
      platform: 'ios',
      keyId: registration.keyId,
      deviceIntegrity,
      riskFlags,
    });

    return {
      verified: true,
      platform: 'ios',
      deviceIntegrity,
      riskFlags,
    };
  }

  /**
   * Validate leaf -> intermediates -> configured root, including validity
   * windows and root self-signature. Returns null when valid, else a reason.
   */
  private verifyCertificateChain(
    chain: crypto.X509Certificate[],
    root: crypto.X509Certificate,
  ): string | null {
    const now = new Date();
    for (const cert of [...chain, root]) {
      const notBefore = new Date(cert.validFrom);
      const notAfter = new Date(cert.validTo);
      if (Number.isNaN(notBefore.getTime()) || Number.isNaN(notAfter.getTime())) {
        return 'certificate has an unparseable validity window';
      }
      if (now < notBefore || now > notAfter) {
        return 'certificate outside its validity window';
      }
    }
    for (let i = 0; i < chain.length; i++) {
      const issuer = i + 1 < chain.length ? chain[i + 1] : root;
      try {
        if (!chain[i].verify(issuer.publicKey)) {
          return 'signature verification failed';
        }
      } catch {
        return 'signature verification failed';
      }
    }
    try {
      if (!root.verify(root.publicKey)) {
        return 'root CA is not self-signed';
      }
    } catch {
      return 'root CA is not self-signed';
    }
    return null;
  }

  private async rejectIos(
    userId: string,
    keyId: string,
    reason: string,
    riskFlags: string[],
  ): Promise<DeviceAttestationResult> {
    await this.truthLog.appendEvent('DEVICE_ATTESTATION_REJECTED', {
      userId,
      platform: 'ios',
      keyId,
      reason,
      riskFlags,
    });
    return {
      verified: false,
      platform: 'ios',
      deviceIntegrity: 'NONE',
      reason,
      riskFlags,
    };
  }

  // -------------------------------------------------------------------------
  // iOS — App Attest assertion verification
  // -------------------------------------------------------------------------

  /**
   * Verify an iOS App Attest assertion against the stored credential key.
   *
   * Validates:
   * 1. Assertion structure is well-formed
   * 2. Key ID matches a previously registered, non-revoked key for this user
   * 3. authenticatorData carries the correct rpIdHash for APPLE_APP_ATTEST_APP_ID
   * 4. Counter is strictly monotonically increasing (replays REJECTED)
   * 5. Signature over SHA256(authData || SHA256(clientDataJSON)) verifies
   *    against the stored public key via crypto.verify
   */
  async verifyiOSAttestation(
    userId: string,
    assertion: AppAttestAssertion,
  ): Promise<DeviceAttestationResult> {
    if (
      !assertion ||
      !assertion.authenticatorData ||
      !assertion.clientDataJSON ||
      !assertion.keyId ||
      !assertion.signature
    ) {
      throw new BadRequestException('Incomplete App Attest assertion');
    }

    const appId = process.env.APPLE_APP_ATTEST_APP_ID;
    if (!appId) {
      return this.handleMissingConfig('ios', 'APPLE_APP_ATTEST_APP_ID');
    }

    const riskFlags: string[] = [];

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

    const authenticatorData = Buffer.from(assertion.authenticatorData, 'base64');
    if (authenticatorData.length < ASSERTION_AUTH_DATA_MIN_LENGTH) {
      return this.rejectIos(userId, assertion.keyId, 'authenticatorData too short', [
        'malformed_assertion',
      ]);
    }

    const expectedRpIdHash = sha256(Buffer.from(appId, 'utf8'));
    if (!constantTimeEquals(authenticatorData.subarray(0, 32), expectedRpIdHash)) {
      return this.rejectIos(
        userId,
        assertion.keyId,
        'rpIdHash does not match APPLE_APP_ATTEST_APP_ID',
        ['rp_id_mismatch'],
      );
    }

    // Strict counter monotonicity: a replayed or rolled-back assertion is
    // REJECTED — it is never downgraded to a "weak but verified" verdict.
    const counter = authenticatorData.readUInt32BE(33);
    const storedCount = Number(key.sign_count);
    if (counter <= storedCount) {
      await this.truthLog.appendEvent('DEVICE_ATTESTATION_COUNTER_REPLAY', {
        userId,
        keyId: assertion.keyId,
        storedCount,
        presentedCount: counter,
      });
      return {
        verified: false,
        platform: 'ios',
        deviceIntegrity: 'NONE',
        reason: 'Assertion counter is not monotonically increasing (possible replay)',
        riskFlags: ['counter_replay'],
      };
    }

    // Apple: nonce = SHA256(authenticatorData || SHA256(clientDataJSON)),
    // signed by the Secure Enclave key with ECDSA-SHA256.
    const clientData = Buffer.from(assertion.clientDataJSON, 'base64');
    const nonce = sha256(Buffer.concat([authenticatorData, sha256(clientData)]));
    const signature = Buffer.from(assertion.signature, 'base64');

    let signatureValid = false;
    try {
      signatureValid = crypto.verify('sha256', nonce, key.public_key, signature);
    } catch {
      signatureValid = false;
    }
    if (!signatureValid) {
      return this.rejectIos(userId, assertion.keyId, 'Assertion signature verification failed', [
        'invalid_signature',
      ]);
    }

    if (!(authenticatorData[32] & FLAG_USER_PRESENT)) {
      riskFlags.push('user_not_present');
    }

    await this.pool.query(
      `UPDATE device_attestation_keys SET sign_count = GREATEST(sign_count, $1) WHERE id = $2`,
      [counter, key.id],
    );

    await this.truthLog.appendEvent('DEVICE_ATTESTATION_VERIFIED', {
      userId,
      platform: 'ios',
      keyId: assertion.keyId,
      verified: true,
      deviceIntegrity: 'STRONG',
      riskFlags,
      counter,
    });

    return {
      verified: true,
      platform: 'ios',
      deviceIntegrity: 'STRONG',
      riskFlags,
    };
  }

  // -------------------------------------------------------------------------
  // Android — Play Integrity JWS verification
  // -------------------------------------------------------------------------

  /**
   * Verify a Google Play Integrity API verdict (standard JWS flow).
   *
   * Validates, in order and fail-closed:
   * 1. Verdict structure and claimed package vs ANDROID_PACKAGE_NAME
   * 2. JWS signature against Google's published JWKS (cached)
   * 3. exp claim (expired tokens are rejected outright)
   * 4. requestDetails.requestPackageName inside the SIGNED payload
   * 5. Only then is deviceRecognitionVerdict trusted
   */
  async verifyAndroidAttestation(
    userId: string,
    verdict: PlayIntegrityVerdict,
  ): Promise<DeviceAttestationResult> {
    if (!verdict || !verdict.tokenResult || !verdict.requestPackageName) {
      throw new BadRequestException('Incomplete Play Integrity verdict');
    }

    const expectedPackage = process.env.ANDROID_PACKAGE_NAME;
    if (!expectedPackage) {
      return this.handleMissingConfig('android', 'ANDROID_PACKAGE_NAME');
    }

    if (verdict.requestPackageName !== expectedPackage) {
      return this.rejectAndroid(userId, 'Claimed package name does not match ANDROID_PACKAGE_NAME', [
        'package_mismatch',
      ]);
    }

    const parts = verdict.tokenResult.split('.');
    if (parts.length !== 3 || parts.some((p) => p.length === 0)) {
      return this.rejectAndroid(userId, 'Token is not a JWS', ['malformed_token']);
    }

    let header: Record<string, unknown>;
    try {
      header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    } catch {
      return this.rejectAndroid(userId, 'Could not decode JWS header', ['malformed_token']);
    }

    const alg = header.alg;
    if (alg !== 'ES256' && alg !== 'RS256') {
      return this.rejectAndroid(userId, `Unsupported JWS algorithm: ${String(alg)}`, [
        'unsupported_algorithm',
      ]);
    }
    const kid = header.kid;
    if (typeof kid !== 'string' || kid.length === 0) {
      return this.rejectAndroid(userId, 'JWS header is missing kid', ['missing_key_id']);
    }

    const jwk = await this.getGoogleSigningKey(kid);
    if (!jwk) {
      return this.rejectAndroid(userId, `No Google signing key found for kid ${kid}`, [
        'unknown_signing_key',
      ]);
    }

    let publicKey: crypto.KeyObject;
    try {
      publicKey = crypto.createPublicKey({ key: jwk as crypto.JsonWebKey, format: 'jwk' });
    } catch {
      return this.rejectAndroid(userId, 'Google signing key could not be imported', [
        'invalid_signing_key',
      ]);
    }

    const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`, 'ascii');
    const signature = Buffer.from(parts[2], 'base64url');
    let signatureValid = false;
    try {
      signatureValid =
        alg === 'ES256'
          ? crypto.verify(
              'sha256',
              signingInput,
              { key: publicKey, dsaEncoding: 'ieee-p1363' },
              signature,
            )
          : crypto.verify('sha256', signingInput, publicKey, signature);
    } catch {
      signatureValid = false;
    }
    if (!signatureValid) {
      return this.rejectAndroid(userId, 'JWS signature verification failed', [
        'invalid_signature',
      ]);
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    } catch {
      return this.rejectAndroid(userId, 'Could not decode JWS payload', ['malformed_token']);
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < nowSeconds) {
      return this.rejectAndroid(userId, 'Token is expired', ['token_expired']);
    }

    const riskFlags: string[] = [];
    const requestDetails = payload.requestDetails as Record<string, unknown> | undefined;
    if (requestDetails?.requestPackageName !== expectedPackage) {
      return this.rejectAndroid(userId, 'Signed payload package name mismatch', [
        'package_mismatch',
      ]);
    }

    const timestampMillis = Number(requestDetails?.timestampMillis);
    if (Number.isFinite(timestampMillis)) {
      if (Date.now() - timestampMillis > PLAY_INTEGRITY_MAX_AGE_MS) {
        riskFlags.push('stale_verdict');
      }
    } else {
      riskFlags.push('missing_timestamp');
    }

    const deviceIntegrityClaim = payload.deviceIntegrity as Record<string, unknown> | undefined;
    const recognitionVerdicts: string[] = Array.isArray(
      deviceIntegrityClaim?.deviceRecognitionVerdict,
    )
      ? (deviceIntegrityClaim!.deviceRecognitionVerdict as unknown[]).filter(
          (v): v is string => typeof v === 'string',
        )
      : [];

    let deviceIntegrity: DeviceAttestationResult['deviceIntegrity'];
    if (
      recognitionVerdicts.includes('MEETS_STRONG_INTEGRITY') ||
      recognitionVerdicts.includes('MEETS_DEVICE_INTEGRITY')
    ) {
      deviceIntegrity = 'STRONG';
    } else if (recognitionVerdicts.includes('MEETS_BASIC_INTEGRITY')) {
      deviceIntegrity = 'WEAK';
      riskFlags.push('basic_integrity_only');
    } else {
      deviceIntegrity = 'NONE';
      riskFlags.push('no_device_integrity');
    }

    const appIntegrityClaim = payload.appIntegrity as Record<string, unknown> | undefined;
    if (appIntegrityClaim?.appRecognitionVerdict !== 'PLAY_RECOGNIZED') {
      riskFlags.push('app_not_play_recognized');
    }

    // Downgrade STRONG on soft risk signals; NONE stays NONE.
    if (
      deviceIntegrity === 'STRONG' &&
      (riskFlags.includes('stale_verdict') ||
        riskFlags.includes('missing_timestamp') ||
        riskFlags.includes('app_not_play_recognized'))
    ) {
      deviceIntegrity = 'WEAK';
    }

    const verified = deviceIntegrity !== 'NONE';

    if (verified) {
      // Record WHICH Google key verified this verdict (kid + SPKI fingerprint),
      // never a fabricated placeholder value.
      const spkiFingerprint = sha256(
        publicKey.export({ type: 'spki', format: 'der' }) as Buffer,
      ).toString('hex');
      await this.pool.query(
        `INSERT INTO device_attestation_keys (user_id, platform, key_id, public_key, device_info)
         VALUES ($1, 'android', $2, $3, $4)
         ON CONFLICT (user_id, platform, key_id) DO UPDATE SET
           public_key = EXCLUDED.public_key,
           device_info = EXCLUDED.device_info,
           revoked = false`,
        [
          userId,
          `play-integrity:${expectedPackage}`,
          `jwks:${kid}:${spkiFingerprint}`,
          JSON.stringify({
            packageName: expectedPackage,
            deviceRecognitionVerdict: recognitionVerdicts,
            appRecognitionVerdict: appIntegrityClaim?.appRecognitionVerdict ?? null,
          }),
        ],
      );
    }

    await this.truthLog.appendEvent('DEVICE_ATTESTATION_VERIFIED', {
      userId,
      platform: 'android',
      packageName: expectedPackage,
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

  private async rejectAndroid(
    userId: string,
    reason: string,
    riskFlags: string[],
  ): Promise<DeviceAttestationResult> {
    await this.truthLog.appendEvent('DEVICE_ATTESTATION_REJECTED', {
      userId,
      platform: 'android',
      reason,
      riskFlags,
    });
    return {
      verified: false,
      platform: 'android',
      deviceIntegrity: 'NONE',
      reason,
      riskFlags,
    };
  }

  private async getGoogleSigningKey(kid: string): Promise<Record<string, unknown> | null> {
    const url = process.env.GOOGLE_PLAY_INTEGRITY_JWKS_URL || DEFAULT_PLAY_INTEGRITY_JWKS_URL;
    const now = Date.now();

    if (
      this.jwksCache &&
      this.jwksCache.url === url &&
      now - this.jwksCache.fetchedAt < JWKS_CACHE_TTL_MS
    ) {
      const cached = this.jwksCache.keys.find((k) => k.kid === kid);
      if (cached) {
        return cached;
      }
      // Unknown kid can mean key rotation — refetch, but not more than once
      // per cooldown window so a flood of bad kids cannot hammer Google.
      if (now - this.jwksCache.fetchedAt < JWKS_REFETCH_COOLDOWN_MS) {
        return null;
      }
    }

    const keys = await this.fetchJwks(url);
    this.jwksCache = { url, fetchedAt: now, keys };
    return keys.find((k) => k.kid === kid) ?? null;
  }

  private async fetchJwks(url: string): Promise<Record<string, unknown>[]> {
    let response: Awaited<ReturnType<typeof fetch>>;
    try {
      response = await fetch(url);
    } catch {
      throw new ServiceUnavailableException('Unable to fetch Play Integrity signing keys');
    }
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Play Integrity JWKS endpoint returned ${response.status}`,
      );
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ServiceUnavailableException('Play Integrity JWKS response is not valid JSON');
    }
    const keys = (body as { keys?: unknown }).keys;
    if (!Array.isArray(keys)) {
      throw new ServiceUnavailableException('Play Integrity JWKS response missing keys array');
    }
    return keys.filter((k): k is Record<string, unknown> => !!k && typeof k === 'object');
  }

  // -------------------------------------------------------------------------
  // Key lifecycle
  // -------------------------------------------------------------------------

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
