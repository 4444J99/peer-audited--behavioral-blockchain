import { ZKPrivacyEngine, NoLogProviderError } from './ZKPrivacyEngine';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  getRandomBytesAsync: jest.fn(async (len: number) => Uint8Array.from({ length: len }, (_, i) => i + 1)),
  digestStringAsync: jest.fn(async (_alg: string, payload: string) => `hash:${payload}`),
}));

describe('ZKPrivacyEngine', () => {
  afterEach(() => {
    ZKPrivacyEngine.resetLogProvider();
  });

  // Regression: the default provider used to return `[]`, which is
  // indistinguishable from "read the logs, found nothing". With no provider
  // installed — the state every shipped build was in — every scan reported
  // compliant and the UI said so, with a stake riding on it. An absent data
  // source must raise, not resolve clean.
  it('refuses to produce a verdict when no log provider is installed', async () => {
    ZKPrivacyEngine.resetLogProvider();
    expect(ZKPrivacyEngine.hasLogProvider()).toBe(false);

    await expect(
      ZKPrivacyEngine.generateLocalProof(
        'contract-1',
        '+1 (555) 111-2222',
        new Date('2026-03-03T00:00:00.000Z'),
        new Date('2026-03-04T00:00:00.000Z'),
      ),
    ).rejects.toThrow(NoLogProviderError);
  });

  it('refuses to produce a breach proof when no log provider is installed', async () => {
    ZKPrivacyEngine.resetLogProvider();

    await expect(
      ZKPrivacyEngine.generateBreachProof('+1 (555) 111-2222', {
        start: new Date('2026-03-03T00:00:00.000Z'),
        end: new Date('2026-03-04T00:00:00.000Z'),
      }),
    ).rejects.toThrow(NoLogProviderError);
  });

  it('reports a provider as installed once one is set', () => {
    ZKPrivacyEngine.setLogProvider(async () => []);
    expect(ZKPrivacyEngine.hasLogProvider()).toBe(true);
  });

  it('generates compliance proof when no local logs are found', async () => {
    ZKPrivacyEngine.setLogProvider(async () => []);

    const result = await ZKPrivacyEngine.generateLocalProof(
      'contract-1',
      '+1 (555) 111-2222',
      new Date('2026-03-03T00:00:00.000Z'),
      new Date('2026-03-04T00:00:00.000Z'),
    );

    expect(result.contractId).toBe('contract-1');
    expect(result.breachDetected).toBe(false);
    expect(result.proofHash).toContain('hash:');
    expect(result.signature).toContain('hash:');
    expect(result.signature).not.toContain('placeholder');
  });

  it('flags breach when log provider returns matching entries', async () => {
    ZKPrivacyEngine.setLogProvider(async () => [
      { counterparty: '+15551112222', timestamp: '2026-03-03T12:00:00.000Z', channel: 'SMS' },
    ]);

    const result = await ZKPrivacyEngine.generateLocalProof(
      'contract-2',
      '555-111-2222',
      new Date('2026-03-03T00:00:00.000Z'),
      new Date('2026-03-04T00:00:00.000Z'),
    );

    expect(result.breachDetected).toBe(true);
  });

  it('ignores matching identifiers outside the requested time window', async () => {
    ZKPrivacyEngine.setLogProvider(async () => [
      { counterparty: '+15551112222', timestamp: '2026-03-01T12:00:00.000Z', channel: 'SMS' },
    ]);

    const result = await ZKPrivacyEngine.generateLocalProof(
      'contract-2',
      '555-111-2222',
      new Date('2026-03-03T00:00:00.000Z'),
      new Date('2026-03-04T00:00:00.000Z'),
    );

    expect(result.breachDetected).toBe(false);
  });

  it('returns null from compatibility breach API when no matching local event exists', async () => {
    ZKPrivacyEngine.setLogProvider(async () => [
      { counterparty: '+15550001111', timestamp: '2026-03-03T12:00:00.000Z', channel: 'SMS' },
    ]);

    const proof = await ZKPrivacyEngine.generateBreachProof('+1 (555) 111-2222', {
      start: new Date('2026-03-03T00:00:00.000Z'),
      end: new Date('2026-03-04T00:00:00.000Z'),
    });

    expect(proof).toBeNull();
  });

  it('generates breach proof from normalized identifier using latest event', async () => {
    ZKPrivacyEngine.setLogProvider(async () => [
      { counterparty: '+1 (555) 111-2222', timestamp: '2026-03-03T01:00:00.000Z', channel: 'SMS' },
      { identifier: '15551112222', timestamp: new Date('2026-03-03T22:00:00.000Z'), method: 'CALL' },
    ]);

    const proof = await ZKPrivacyEngine.generateBreachProof('555-111-2222', {
      start: new Date('2026-03-03T00:00:00.000Z'),
      end: new Date('2026-03-04T00:00:00.000Z'),
    });

    expect(proof).not.toBeNull();
    expect(proof?.timestamp).toBe('2026-03-03T22:00:00.000Z');
    expect(proof?.method).toBe('CALL');
    expect(proof?.maskedIdentifier).toBe('55...22');
    expect(proof?.proofHash).toContain('hash:');
    expect(proof?.deviceSignature).toContain('hash:');
  });

  it('throws for invalid time window ordering', async () => {
    await expect(
      ZKPrivacyEngine.generateLocalProof(
        'contract-3',
        '+15550000000',
        new Date('2026-03-05T00:00:00.000Z'),
        new Date('2026-03-04T00:00:00.000Z'),
      ),
    ).rejects.toThrow('timeWindowStart must be earlier than timeWindowEnd');
  });
});
