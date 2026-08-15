import {
  deriveStakeGuidance,
  findMostRecentActiveContract,
} from './stake-guidance';

const contract = (id: string, status: string, created_at: string) => ({
  id,
  status,
  created_at,
});

describe('findMostRecentActiveContract', () => {
  it('returns the newest ACTIVE contract', () => {
    const result = findMostRecentActiveContract([
      contract('c-old', 'ACTIVE', '2026-01-01T00:00:00Z'),
      contract('c-new', 'ACTIVE', '2026-03-01T00:00:00Z'),
      contract('c-mid', 'ACTIVE', '2026-02-01T00:00:00Z'),
    ]);

    expect(result?.id).toBe('c-new');
  });

  it('ignores contracts that are not ACTIVE', () => {
    const result = findMostRecentActiveContract([
      contract('c-failed', 'FAILED', '2026-04-01T00:00:00Z'),
      contract('c-completed', 'COMPLETED', '2026-03-01T00:00:00Z'),
      contract('c-active', 'ACTIVE', '2026-01-01T00:00:00Z'),
    ]);

    expect(result?.id).toBe('c-active');
  });

  it('returns null when the user holds no active contract', () => {
    expect(findMostRecentActiveContract([])).toBeNull();
    expect(
      findMostRecentActiveContract([
        contract('c-1', 'PENDING_STAKE', '2026-01-01T00:00:00Z'),
      ]),
    ).toBeNull();
  });
});

describe('deriveStakeGuidance', () => {
  it('derives a suggested stake and a whole-percent reduction', () => {
    const guidance = deriveStakeGuidance(
      { multiplier: 0.85, reason: 'weekend vulnerability in final 30%' },
      30,
    );

    expect(guidance).toEqual({
      multiplier: 0.85,
      reason: 'weekend vulnerability in final 30%',
      suggestedStakeUsd: 25.5,
      reductionPercent: 15,
    });
  });

  it('rounds the suggested stake to whole cents', () => {
    const guidance = deriveStakeGuidance(
      { multiplier: 0.765, reason: '2 prior violation(s); weekend' },
      33,
    );

    expect(guidance?.suggestedStakeUsd).toBe(25.25);
  });

  it('returns null when no downscaling applies', () => {
    expect(
      deriveStakeGuidance(
        { multiplier: 1, reason: 'no downscaling applied' },
        30,
      ),
    ).toBeNull();
    expect(deriveStakeGuidance(null, 30)).toBeNull();
    expect(deriveStakeGuidance(undefined, 30)).toBeNull();
  });

  it('returns null for a multiplier the service could not have meant', () => {
    // A multiplier above 1 would be an UPSCALE — advising a user to raise a
    // stake is a different product decision entirely, so it is refused here
    // rather than rendered.
    expect(
      deriveStakeGuidance({ multiplier: 1.4, reason: 'bad signal' }, 30),
    ).toBeNull();
    expect(
      deriveStakeGuidance({ multiplier: 0, reason: 'bad signal' }, 30),
    ).toBeNull();
    expect(
      deriveStakeGuidance({ multiplier: Number.NaN, reason: 'bad signal' }, 30),
    ).toBeNull();
  });

  it('returns null when no stake has been chosen yet', () => {
    expect(
      deriveStakeGuidance({ multiplier: 0.9, reason: '1 prior violation(s)' }, 0),
    ).toBeNull();
  });
});
