import { Pool } from 'pg';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import * as crypto from 'crypto';
import { DeviceAttestationService } from './device-attestation.service';

const APP_ID = 'TEAMID1234.com.styx.app';
const PACKAGE_NAME = 'com.styx.app';
const JWKS_URL = 'https://jwks.test/keys';

const sha256 = (data: Buffer | string) => crypto.createHash('sha256').update(data).digest();

// ---------------------------------------------------------------------------
// Minimal CBOR encoder — fixture side of the service's strict decoder.
// ---------------------------------------------------------------------------

function cborHead(major: number, length: number): Buffer {
  if (length < 24) return Buffer.from([(major << 5) | length]);
  if (length < 0x100) return Buffer.from([(major << 5) | 24, length]);
  if (length < 0x10000) {
    const b = Buffer.alloc(3);
    b[0] = (major << 5) | 25;
    b.writeUInt16BE(length, 1);
    return b;
  }
  const b = Buffer.alloc(5);
  b[0] = (major << 5) | 26;
  b.writeUInt32BE(length, 1);
  return b;
}

function encodeCbor(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return Buffer.concat([cborHead(2, value.length), value]);
  if (typeof value === 'string') {
    const b = Buffer.from(value, 'utf8');
    return Buffer.concat([cborHead(3, b.length), b]);
  }
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return cborHead(0, value);
  }
  if (Array.isArray(value)) {
    return Buffer.concat([cborHead(4, value.length), ...value.map(encodeCbor)]);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    return Buffer.concat([
      cborHead(5, keys.length),
      ...keys.flatMap((k) => [encodeCbor(k), encodeCbor(record[k])]),
    ]);
  }
  throw new Error('unsupported CBOR fixture value');
}

// ---------------------------------------------------------------------------
// Minimal DER / X.509 builders — real signed certificates via Node crypto.
// ---------------------------------------------------------------------------

const derLength = (n: number): Buffer => {
  if (n < 128) return Buffer.from([n]);
  if (n < 256) return Buffer.from([0x81, n]);
  const b = Buffer.alloc(3);
  b[0] = 0x82;
  b.writeUInt16BE(n, 1);
  return b;
};
const der = (tag: number, content: Buffer): Buffer =>
  Buffer.concat([Buffer.from([tag]), derLength(content.length), content]);
const derSeq = (...parts: Buffer[]) => der(0x30, Buffer.concat(parts));
const derSet = (...parts: Buffer[]) => der(0x31, Buffer.concat(parts));
const derInt = (n: number): Buffer => der(0x02, n > 127 ? Buffer.from([0, n]) : Buffer.from([n]));
const derOctet = (b: Buffer) => der(0x04, b);
const derBitString = (b: Buffer) => der(0x03, Buffer.concat([Buffer.from([0]), b]));
const derUtf8 = (s: string) => der(0x0c, Buffer.from(s, 'utf8'));
const derUtc = (s: string) => der(0x17, Buffer.from(s, 'ascii'));

const OID_ECDSA_SHA256 = Buffer.from('06082a8648ce3d040302', 'hex'); // 1.2.840.10045.4.3.2
const OID_CN = Buffer.from('0603550403', 'hex'); // 2.5.4.3
const OID_APPLE_NONCE = Buffer.from('06092a864886f763640802', 'hex'); // 1.2.840.113635.100.8.2

const sigAlg = derSeq(OID_ECDSA_SHA256);
const makeName = (cn: string) => derSeq(derSet(derSeq(OID_CN, derUtf8(cn))));

// extnValue: OCTET STRING { SEQUENCE { [1] { OCTET STRING nonce } } }
const appleNonceExtension = (nonce: Buffer) =>
  derSeq(OID_APPLE_NONCE, derOctet(derSeq(der(0xa1, derOctet(nonce)))));

interface CertSpec {
  serial: number;
  subjectCn: string;
  issuerCn: string;
  publicKey: crypto.KeyObject;
  signingKey: crypto.KeyObject;
  extensions?: Buffer[];
}

function makeCertDer(spec: CertSpec): Buffer {
  const spki = spec.publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
  const parts = [
    der(0xa0, derInt(2)), // version v3
    derInt(spec.serial),
    sigAlg,
    makeName(spec.issuerCn),
    derSeq(derUtc('200101000000Z'), derUtc('400101000000Z')),
    makeName(spec.subjectCn),
    spki,
  ];
  if (spec.extensions && spec.extensions.length > 0) {
    parts.push(der(0xa3, derSeq(...spec.extensions)));
  }
  const tbs = derSeq(...parts);
  const signature = crypto.sign('sha256', tbs, spec.signingKey);
  return derSeq(tbs, sigAlg, derBitString(signature));
}

const derToPem = (derBuf: Buffer) =>
  `-----BEGIN CERTIFICATE-----\n${derBuf
    .toString('base64')
    .match(/.{1,64}/g)!
    .join('\n')}\n-----END CERTIFICATE-----\n`;

const ecKeyPair = () => crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });

const uncompressedPoint = (publicKey: crypto.KeyObject): Buffer => {
  const jwk = publicKey.export({ format: 'jwk' }) as { x: string; y: string };
  return Buffer.concat([
    Buffer.from([0x04]),
    Buffer.from(jwk.x, 'base64url'),
    Buffer.from(jwk.y, 'base64url'),
  ]);
};

const AAGUID_PROD = Buffer.concat([Buffer.from('appattest', 'ascii'), Buffer.alloc(7)]);

interface IosFixtureOptions {
  challenge?: string;
  aaguid?: Buffer;
  breakChain?: boolean;
  tamperNonce?: boolean;
  overrideKeyId?: string;
}

function buildIosRegistrationFixture(opts: IosFixtureOptions = {}) {
  const root = ecKeyPair();
  const intermediate = ecKeyPair();
  const cred = ecKeyPair();

  const rootDer = makeCertDer({
    serial: 1,
    subjectCn: 'Test App Attest Root',
    issuerCn: 'Test App Attest Root',
    publicKey: root.publicKey,
    signingKey: root.privateKey,
  });
  const interDer = makeCertDer({
    serial: 2,
    subjectCn: 'Test App Attest CA 1',
    issuerCn: 'Test App Attest Root',
    publicKey: intermediate.publicKey,
    signingKey: root.privateKey,
  });

  const keyIdBytes = sha256(uncompressedPoint(cred.publicKey));
  const challenge = opts.challenge ?? 'server-challenge-abc123';
  const aaguid = opts.aaguid ?? AAGUID_PROD;

  const authData = Buffer.concat([
    sha256(Buffer.from(APP_ID, 'utf8')), // rpIdHash
    Buffer.from([0x41]), // flags: UP | AT
    Buffer.alloc(4), // counter = 0
    aaguid,
    Buffer.from([0x00, 0x20]), // credIdLen = 32
    keyIdBytes,
  ]);

  const clientDataHash = sha256(Buffer.from(challenge, 'utf8'));
  let nonce = sha256(Buffer.concat([authData, clientDataHash]));
  if (opts.tamperNonce) {
    nonce = sha256(Buffer.from('tampered-nonce-source'));
  }

  const credSigner = opts.breakChain ? ecKeyPair().privateKey : intermediate.privateKey;
  const credDer = makeCertDer({
    serial: 3,
    subjectCn: 'Test Credential',
    issuerCn: 'Test App Attest CA 1',
    publicKey: cred.publicKey,
    signingKey: credSigner,
    extensions: [appleNonceExtension(nonce)],
  });

  const attestationObject = encodeCbor({
    fmt: 'apple-appattest',
    attStmt: { x5c: [credDer, interDer], receipt: Buffer.alloc(0) },
    authData,
  });

  return {
    rootPem: derToPem(rootDer),
    registration: {
      keyId: opts.overrideKeyId ?? keyIdBytes.toString('base64'),
      attestationObject: attestationObject.toString('base64'),
      challenge,
    },
    credKeys: cred,
    keyIdBytes,
  };
}

function buildIosAssertion(
  privateKey: crypto.KeyObject,
  counter: number,
  opts: { tamperSignature?: boolean; wrongRpId?: boolean } = {},
) {
  const clientDataJSON = Buffer.from(JSON.stringify({ challenge: 'assertion-challenge-1' }));
  const rpIdSource = opts.wrongRpId ? 'WRONGTEAM.com.other.app' : APP_ID;
  const counterBuf = Buffer.alloc(4);
  counterBuf.writeUInt32BE(counter, 0);
  const authenticatorData = Buffer.concat([
    sha256(Buffer.from(rpIdSource, 'utf8')),
    Buffer.from([0x01]), // flags: UP
    counterBuf,
  ]);
  const nonce = sha256(Buffer.concat([authenticatorData, sha256(clientDataJSON)]));
  const signature = crypto.sign('sha256', nonce, privateKey);
  if (opts.tamperSignature) {
    signature[signature.length - 1] ^= 0xff;
  }
  return {
    keyId: 'stored-key-id',
    authenticatorData: authenticatorData.toString('base64'),
    clientDataJSON: clientDataJSON.toString('base64'),
    signature: signature.toString('base64'),
  };
}

// ---------------------------------------------------------------------------
// Play Integrity JWS fixtures
// ---------------------------------------------------------------------------

const b64url = (b: Buffer) => b.toString('base64url');

function makePlayIntegrityToken(
  payload: Record<string, unknown>,
  privateKey: crypto.KeyObject,
  opts: { kid?: string; alg?: string; tamperSignature?: boolean } = {},
): string {
  const header = { alg: opts.alg ?? 'ES256', kid: opts.kid ?? 'itest-key-1' };
  const h = b64url(Buffer.from(JSON.stringify(header), 'utf8'));
  const p = b64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const signature = crypto.sign('sha256', Buffer.from(`${h}.${p}`, 'ascii'), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  });
  if (opts.tamperSignature) {
    signature[0] ^= 0xff;
  }
  return `${h}.${p}.${b64url(signature)}`;
}

function playIntegrityPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    requestDetails: {
      requestPackageName: PACKAGE_NAME,
      timestampMillis: String(Date.now()),
      nonce: 'req-nonce',
    },
    appIntegrity: { appRecognitionVerdict: 'PLAY_RECOGNIZED' },
    deviceIntegrity: {
      deviceRecognitionVerdict: ['MEETS_DEVICE_INTEGRITY', 'MEETS_STRONG_INTEGRITY'],
    },
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

const ENV_KEYS = [
  'APPLE_APP_ATTEST_APP_ID',
  'APPLE_APP_ATTEST_ROOT_CA_PEM',
  'ANDROID_PACKAGE_NAME',
  'GOOGLE_PLAY_INTEGRITY_JWKS_URL',
  'DEVICE_ATTESTATION_DEV_BYPASS',
  'NODE_ENV',
] as const;

describe('DeviceAttestationService', () => {
  let service: DeviceAttestationService;
  let pool: jest.Mocked<Pool>;
  let truthLog: { appendEvent: jest.Mock };
  const savedEnv: Record<string, string | undefined> = {};
  const originalFetch = global.fetch;

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
    }
    delete process.env.DEVICE_ATTESTATION_DEV_BYPASS;
    process.env.APPLE_APP_ATTEST_APP_ID = APP_ID;
    process.env.ANDROID_PACKAGE_NAME = PACKAGE_NAME;
    process.env.GOOGLE_PLAY_INTEGRITY_JWKS_URL = JWKS_URL;

    pool = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }) } as any;
    truthLog = { appendEvent: jest.fn().mockResolvedValue('event-hash') };
    service = new DeviceAttestationService(pool, truthLog as any);
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('registerIosAttestedKey', () => {
    it('verifies a valid attestation object and stores the real public key', async () => {
      const fixture = buildIosRegistrationFixture();
      process.env.APPLE_APP_ATTEST_ROOT_CA_PEM = fixture.rootPem;

      const result = await service.registerIosAttestedKey('user-1', fixture.registration);

      expect(result.verified).toBe(true);
      expect(result.deviceIntegrity).toBe('STRONG');
      expect(result.riskFlags).toEqual([]);

      const insertCall = (pool.query as jest.Mock).mock.calls.find(([sql]) =>
        String(sql).includes('INSERT INTO device_attestation_keys'),
      );
      expect(insertCall).toBeDefined();
      const [, params] = insertCall!;
      expect(params[0]).toBe('user-1');
      expect(params[1]).toBe(fixture.registration.keyId);
      // The stored key is the actual attested credential public key, as PEM.
      expect(params[2]).toContain('BEGIN PUBLIC KEY');
      expect(params[2]).toBe(
        fixture.credKeys.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
      );
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'DEVICE_KEY_REGISTERED',
        expect.objectContaining({ platform: 'ios', keyId: fixture.registration.keyId }),
      );
    });

    it('rejects a certificate chain that does not lead to the configured root', async () => {
      const fixture = buildIosRegistrationFixture({ breakChain: true });
      process.env.APPLE_APP_ATTEST_ROOT_CA_PEM = fixture.rootPem;

      const result = await service.registerIosAttestedKey('user-1', fixture.registration);

      expect(result.verified).toBe(false);
      expect(result.deviceIntegrity).toBe('NONE');
      expect(result.riskFlags).toContain('invalid_certificate_chain');
      expect(
        (pool.query as jest.Mock).mock.calls.some(([sql]) => String(sql).includes('INSERT')),
      ).toBe(false);
    });

    it('rejects a chain anchored to a different root CA', async () => {
      const fixture = buildIosRegistrationFixture();
      const otherRoot = buildIosRegistrationFixture();
      process.env.APPLE_APP_ATTEST_ROOT_CA_PEM = otherRoot.rootPem;

      const result = await service.registerIosAttestedKey('user-1', fixture.registration);

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('invalid_certificate_chain');
    });

    it('rejects when the certificate nonce does not bind the challenge', async () => {
      const fixture = buildIosRegistrationFixture({ tamperNonce: true });
      process.env.APPLE_APP_ATTEST_ROOT_CA_PEM = fixture.rootPem;

      const result = await service.registerIosAttestedKey('user-1', fixture.registration);

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('nonce_mismatch');
    });

    it('rejects when the challenge presented differs from the one bound in the cert', async () => {
      const fixture = buildIosRegistrationFixture();
      process.env.APPLE_APP_ATTEST_ROOT_CA_PEM = fixture.rootPem;

      const result = await service.registerIosAttestedKey('user-1', {
        ...fixture.registration,
        challenge: 'a-different-challenge',
      });

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('nonce_mismatch');
    });

    it('rejects a keyId that is not the SHA-256 of the attested public key', async () => {
      const fixture = buildIosRegistrationFixture({
        overrideKeyId: crypto.randomBytes(32).toString('base64'),
      });
      process.env.APPLE_APP_ATTEST_ROOT_CA_PEM = fixture.rootPem;

      const result = await service.registerIosAttestedKey('user-1', fixture.registration);

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('key_id_mismatch');
    });

    it('rejects garbage attestation objects as malformed', async () => {
      const fixture = buildIosRegistrationFixture();
      process.env.APPLE_APP_ATTEST_ROOT_CA_PEM = fixture.rootPem;

      const result = await service.registerIosAttestedKey('user-1', {
        ...fixture.registration,
        attestationObject: crypto.randomBytes(64).toString('base64'),
      });

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('malformed_attestation');
    });

    it('fails closed when APPLE_APP_ATTEST_ROOT_CA_PEM is missing', async () => {
      const fixture = buildIosRegistrationFixture();
      delete process.env.APPLE_APP_ATTEST_ROOT_CA_PEM;

      await expect(
        service.registerIosAttestedKey('user-1', fixture.registration),
      ).rejects.toThrow(ServiceUnavailableException);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('fails closed when APPLE_APP_ATTEST_APP_ID is missing', async () => {
      const fixture = buildIosRegistrationFixture();
      process.env.APPLE_APP_ATTEST_ROOT_CA_PEM = fixture.rootPem;
      delete process.env.APPLE_APP_ATTEST_APP_ID;

      await expect(
        service.registerIosAttestedKey('user-1', fixture.registration),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('returns a DEV_BYPASS verdict (never STRONG) with the explicit dev flag', async () => {
      const fixture = buildIosRegistrationFixture();
      delete process.env.APPLE_APP_ATTEST_ROOT_CA_PEM;
      process.env.DEVICE_ATTESTATION_DEV_BYPASS = 'true';

      const result = await service.registerIosAttestedKey('user-1', fixture.registration);

      expect(result.deviceIntegrity).toBe('DEV_BYPASS');
      expect(result.deviceIntegrity).not.toBe('STRONG');
      expect(result.riskFlags).toContain('dev_bypass');
      // Simulated verdicts never touch the database.
      expect(pool.query).not.toHaveBeenCalled();
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'DEVICE_ATTESTATION_DEV_BYPASS',
        expect.objectContaining({ platform: 'ios' }),
      );
    });

    it('ignores the dev bypass flag in production and still fails closed', async () => {
      const fixture = buildIosRegistrationFixture();
      delete process.env.APPLE_APP_ATTEST_ROOT_CA_PEM;
      process.env.DEVICE_ATTESTATION_DEV_BYPASS = 'true';
      process.env.NODE_ENV = 'production';

      await expect(
        service.registerIosAttestedKey('user-1', fixture.registration),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('throws on incomplete registration payloads', async () => {
      await expect(
        service.registerIosAttestedKey('user-1', {
          keyId: '',
          attestationObject: '',
          challenge: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyiOSAttestation', () => {
    const storedKeyRow = (publicKey: crypto.KeyObject, signCount: number) => ({
      rows: [
        {
          id: 'key-row-1',
          public_key: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
          sign_count: signCount,
          device_info: {},
        },
      ],
      rowCount: 1,
    });

    it('verifies a valid assertion signature and returns STRONG', async () => {
      const keys = ecKeyPair();
      (pool.query as jest.Mock)
        .mockResolvedValueOnce(storedKeyRow(keys.publicKey, 5))
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const assertion = buildIosAssertion(keys.privateKey, 10);
      const result = await service.verifyiOSAttestation('user-1', assertion);

      expect(result.verified).toBe(true);
      expect(result.deviceIntegrity).toBe('STRONG');
      expect(result.riskFlags).toEqual([]);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('GREATEST(sign_count, $1)'),
        [10, 'key-row-1'],
      );
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'DEVICE_ATTESTATION_VERIFIED',
        expect.objectContaining({ platform: 'ios', counter: 10 }),
      );
    });

    it('rejects a tampered signature', async () => {
      const keys = ecKeyPair();
      (pool.query as jest.Mock).mockResolvedValueOnce(storedKeyRow(keys.publicKey, 5));

      const assertion = buildIosAssertion(keys.privateKey, 10, { tamperSignature: true });
      const result = await service.verifyiOSAttestation('user-1', assertion);

      expect(result.verified).toBe(false);
      expect(result.deviceIntegrity).toBe('NONE');
      expect(result.riskFlags).toContain('invalid_signature');
      // No sign_count update after a failed verification.
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('rejects a signature produced by a different key', async () => {
      const stored = ecKeyPair();
      const attacker = ecKeyPair();
      (pool.query as jest.Mock).mockResolvedValueOnce(storedKeyRow(stored.publicKey, 5));

      const assertion = buildIosAssertion(attacker.privateKey, 10);
      const result = await service.verifyiOSAttestation('user-1', assertion);

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('invalid_signature');
    });

    it('rejects a replayed counter instead of downgrading it', async () => {
      const keys = ecKeyPair();
      (pool.query as jest.Mock).mockResolvedValueOnce(storedKeyRow(keys.publicKey, 10));

      const assertion = buildIosAssertion(keys.privateKey, 10); // equal, not greater
      const result = await service.verifyiOSAttestation('user-1', assertion);

      expect(result.verified).toBe(false);
      expect(result.deviceIntegrity).toBe('NONE');
      expect(result.riskFlags).toContain('counter_replay');
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(truthLog.appendEvent).toHaveBeenCalledWith(
        'DEVICE_ATTESTATION_COUNTER_REPLAY',
        expect.objectContaining({ storedCount: 10, presentedCount: 10 }),
      );
    });

    it('rejects an rpIdHash that does not match the configured App ID', async () => {
      const keys = ecKeyPair();
      (pool.query as jest.Mock).mockResolvedValueOnce(storedKeyRow(keys.publicKey, 5));

      const assertion = buildIosAssertion(keys.privateKey, 10, { wrongRpId: true });
      const result = await service.verifyiOSAttestation('user-1', assertion);

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('rp_id_mismatch');
    });

    it('returns NONE when the key is not registered', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const keys = ecKeyPair();
      const result = await service.verifyiOSAttestation(
        'user-1',
        buildIosAssertion(keys.privateKey, 1),
      );

      expect(result.verified).toBe(false);
      expect(result.deviceIntegrity).toBe('NONE');
      expect(result.riskFlags).toContain('unknown_key');
    });

    it('fails closed when APPLE_APP_ATTEST_APP_ID is missing', async () => {
      delete process.env.APPLE_APP_ATTEST_APP_ID;
      const keys = ecKeyPair();

      await expect(
        service.verifyiOSAttestation('user-1', buildIosAssertion(keys.privateKey, 1)),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('returns DEV_BYPASS with the explicit dev flag when config is missing', async () => {
      delete process.env.APPLE_APP_ATTEST_APP_ID;
      process.env.DEVICE_ATTESTATION_DEV_BYPASS = 'true';
      const keys = ecKeyPair();

      const result = await service.verifyiOSAttestation(
        'user-1',
        buildIosAssertion(keys.privateKey, 1),
      );

      expect(result.deviceIntegrity).toBe('DEV_BYPASS');
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('throws on incomplete assertions', async () => {
      await expect(
        service.verifyiOSAttestation('user-1', {
          authenticatorData: '',
          clientDataJSON: '',
          keyId: '',
          signature: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyAndroidAttestation', () => {
    let googleKeys: crypto.KeyPairKeyObjectResult;
    let jwks: { keys: Record<string, unknown>[] };
    let fetchMock: jest.Mock;

    beforeEach(() => {
      googleKeys = ecKeyPair();
      const jwk = googleKeys.publicKey.export({ format: 'jwk' }) as Record<string, unknown>;
      jwks = { keys: [{ ...jwk, kid: 'itest-key-1', use: 'sig', alg: 'ES256' }] };
      fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => jwks,
      });
      global.fetch = fetchMock as any;
    });

    it('verifies a validly signed token and returns STRONG', async () => {
      const token = makePlayIntegrityToken(playIntegrityPayload(), googleKeys.privateKey); // allow-secret

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: PACKAGE_NAME,
      });

      expect(result.verified).toBe(true);
      expect(result.deviceIntegrity).toBe('STRONG');
      expect(fetchMock).toHaveBeenCalledWith(JWKS_URL);

      const insertCall = (pool.query as jest.Mock).mock.calls.find(([sql]) =>
        String(sql).includes('INSERT INTO device_attestation_keys'),
      );
      expect(insertCall).toBeDefined();
      const [, params] = insertCall!;
      expect(params[1]).toBe(`play-integrity:${PACKAGE_NAME}`);
      // Records the verifying Google key, not a fabricated placeholder.
      expect(params[2]).toMatch(/^jwks:itest-key-1:[0-9a-f]{64}$/);
    });

    it('caches the JWKS across verifications', async () => {
      const token = makePlayIntegrityToken(playIntegrityPayload(), googleKeys.privateKey); // allow-secret

      await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: PACKAGE_NAME,
      });
      await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: PACKAGE_NAME,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('rejects a tampered signature', async () => {
      const token = makePlayIntegrityToken(playIntegrityPayload(), googleKeys.privateKey, { // allow-secret
        tamperSignature: true,
      });

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: PACKAGE_NAME,
      });

      expect(result.verified).toBe(false);
      expect(result.deviceIntegrity).toBe('NONE');
      expect(result.riskFlags).toContain('invalid_signature');
    });

    it('rejects a token signed by a key not in the JWKS', async () => {
      const rogue = ecKeyPair();
      const token = makePlayIntegrityToken(playIntegrityPayload(), rogue.privateKey, { // allow-secret
        kid: 'rogue-kid',
      });

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: PACKAGE_NAME,
      });

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('unknown_signing_key');
    });

    it('rejects an expired token outright', async () => {
      const token = makePlayIntegrityToken( // allow-secret
        playIntegrityPayload({ exp: Math.floor(Date.now() / 1000) - 60 }),
        googleKeys.privateKey,
      );

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: PACKAGE_NAME,
      });

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('token_expired');
    });

    it('rejects when the signed payload package name differs from ANDROID_PACKAGE_NAME', async () => {
      const token = makePlayIntegrityToken( // allow-secret
        playIntegrityPayload({
          requestDetails: {
            requestPackageName: 'com.evil.app',
            timestampMillis: String(Date.now()),
          },
        }),
        googleKeys.privateKey,
      );

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: PACKAGE_NAME,
      });

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('package_mismatch');
    });

    it('rejects a claimed package mismatch before any network call', async () => {
      const token = makePlayIntegrityToken(playIntegrityPayload(), googleKeys.privateKey); // allow-secret

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: 'com.evil.app',
      });

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('package_mismatch');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects malformed tokens', async () => {
      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: 'not-a-jwt',
        requestPackageName: PACKAGE_NAME,
      });

      expect(result.verified).toBe(false);
      expect(result.riskFlags).toContain('malformed_token');
    });

    it('returns WEAK for basic-integrity-only devices', async () => {
      const token = makePlayIntegrityToken( // allow-secret
        playIntegrityPayload({
          deviceIntegrity: { deviceRecognitionVerdict: ['MEETS_BASIC_INTEGRITY'] },
        }),
        googleKeys.privateKey,
      );

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: PACKAGE_NAME,
      });

      expect(result.verified).toBe(true);
      expect(result.deviceIntegrity).toBe('WEAK');
      expect(result.riskFlags).toContain('basic_integrity_only');
    });

    it('returns NONE when the signed verdict carries no device integrity', async () => {
      const token = makePlayIntegrityToken( // allow-secret
        playIntegrityPayload({ deviceIntegrity: { deviceRecognitionVerdict: [] } }),
        googleKeys.privateKey,
      );

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: PACKAGE_NAME,
      });

      expect(result.verified).toBe(false);
      expect(result.deviceIntegrity).toBe('NONE');
      expect(result.riskFlags).toContain('no_device_integrity');
    });

    it('downgrades STRONG to WEAK when the app is not Play-recognized', async () => {
      const token = makePlayIntegrityToken( // allow-secret
        playIntegrityPayload({
          appIntegrity: { appRecognitionVerdict: 'UNRECOGNIZED_VERSION' },
        }),
        googleKeys.privateKey,
      );

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: PACKAGE_NAME,
      });

      expect(result.verified).toBe(true);
      expect(result.deviceIntegrity).toBe('WEAK');
      expect(result.riskFlags).toContain('app_not_play_recognized');
    });

    it('fails closed when ANDROID_PACKAGE_NAME is missing', async () => {
      delete process.env.ANDROID_PACKAGE_NAME;
      const token = makePlayIntegrityToken(playIntegrityPayload(), googleKeys.privateKey); // allow-secret

      await expect(
        service.verifyAndroidAttestation('user-1', {
          tokenResult: token,
          requestPackageName: PACKAGE_NAME,
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('returns DEV_BYPASS with the explicit dev flag when config is missing', async () => {
      delete process.env.ANDROID_PACKAGE_NAME;
      process.env.DEVICE_ATTESTATION_DEV_BYPASS = 'true';
      const token = makePlayIntegrityToken(playIntegrityPayload(), googleKeys.privateKey); // allow-secret

      const result = await service.verifyAndroidAttestation('user-1', {
        tokenResult: token,
        requestPackageName: PACKAGE_NAME,
      });

      expect(result.deviceIntegrity).toBe('DEV_BYPASS');
      expect(result.verified).toBe(true);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('ignores the dev bypass flag in production', async () => {
      delete process.env.ANDROID_PACKAGE_NAME;
      process.env.DEVICE_ATTESTATION_DEV_BYPASS = 'true';
      process.env.NODE_ENV = 'production';
      const token = makePlayIntegrityToken(playIntegrityPayload(), googleKeys.privateKey); // allow-secret

      await expect(
        service.verifyAndroidAttestation('user-1', {
          tokenResult: token,
          requestPackageName: PACKAGE_NAME,
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('fails closed when the JWKS endpoint is unreachable', async () => {
      fetchMock.mockRejectedValue(new Error('network down'));
      const token = makePlayIntegrityToken(playIntegrityPayload(), googleKeys.privateKey); // allow-secret

      await expect(
        service.verifyAndroidAttestation('user-1', {
          tokenResult: token,
          requestPackageName: PACKAGE_NAME,
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('throws on incomplete verdicts', async () => {
      await expect(
        service.verifyAndroidAttestation('user-1', {
          tokenResult: '',
          requestPackageName: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('revokeKey', () => {
    it('revokes a key and appends a truth log event', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await service.revokeKey('user-1', 'key-abc');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SET revoked = true'),
        ['user-1', 'key-abc'],
      );
      expect(truthLog.appendEvent).toHaveBeenCalledWith('DEVICE_KEY_REVOKED', {
        userId: 'user-1',
        keyId: 'key-abc',
      });
    });
  });
});
