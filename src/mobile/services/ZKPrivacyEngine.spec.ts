import { ZKPrivacyEngine } from './ZKPrivacyEngine';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  getRandomBytesAsync: jest.fn(async (len: number) => Uint8Array.from({ length: len }, (_, i) => i + 1)),
  digestStringAsync: jest.fn(async (_alg: string, payload: string) => `hash:${payload}`),
}));

describe('ZKPrivacyEngine', () => {
  afterEach(() => {
    ZKPrivacyEngine.resetLogProvider();
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
