import { buildSettlementQuote } from './settlement-quote';

describe('buildSettlementQuote', () => {
  it('releases the full stake on success', () => {
    expect(buildSettlementQuote(5000, 'PASS')).toEqual({
      totalCents: 5000,
      platformFeeCents: 0,
      bountyPoolCents: 0,
      userRefundCents: 5000,
      actualAction: 'RELEASE',
    });
  });

  it('captures using the provisional 80/20 split in capture-allowed failures', () => {
    expect(buildSettlementQuote(10000, 'FAIL', 'CAPTURE')).toEqual({
      totalCents: 10000,
      platformFeeCents: 8000,
      bountyPoolCents: 2000,
      userRefundCents: 0,
      actualAction: 'CAPTURE',
    });
  });

  it('releases the full stake for refund-only failures', () => {
    expect(buildSettlementQuote(3900, 'FAIL', 'REFUND')).toEqual({
      totalCents: 3900,
      platformFeeCents: 0,
      bountyPoolCents: 0,
      userRefundCents: 3900,
      actualAction: 'RELEASE',
    });
  });

  it('rejects non-integer amounts so all callers stay in cents', () => {
    expect(() => buildSettlementQuote(25.5, 'FAIL', 'CAPTURE')).toThrow(/integer cents/i);
  });
});
