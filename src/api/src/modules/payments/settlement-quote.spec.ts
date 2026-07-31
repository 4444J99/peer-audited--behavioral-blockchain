import { buildSettlementQuote, distributeBountyPool } from './settlement-quote';

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

  // DR-002: the whole forfeited stake goes to the platform. No Fury bounty pool,
  // no reserve pool, no partial refund — see planning--founder-decisions-of-record.md.
  it('captures the entire stake to the platform in capture-allowed failures', () => {
    expect(buildSettlementQuote(10000, 'FAIL', 'CAPTURE')).toEqual({
      totalCents: 10000,
      platformFeeCents: 10000,
      bountyPoolCents: 0,
      userRefundCents: 0,
      actualAction: 'CAPTURE',
    });
  });

  // Guards the property the downstream consumers rely on: every bounty-pool branch is
  // dead under DR-002, so no ledger entry or Stripe transfer is attempted for a zero
  // amount. An odd stake also proves no cent is stranded.
  it('leaves no bounty pool and strands no cents on an odd stake', () => {
    const quote = buildSettlementQuote(3333, 'FAIL', 'CAPTURE');
    expect(quote.bountyPoolCents).toBe(0);
    expect(quote.platformFeeCents + quote.bountyPoolCents + quote.userRefundCents).toBe(3333);
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

// The bounty pool is 0 under DR-002, so no production path exercises this split today.
// It is tested directly rather than through a settlement so the no-cents-lost guarantee
// stays covered while the rate is zero.
describe('distributeBountyPool', () => {
  it('gives every Fury an equal share when the pool divides evenly', () => {
    expect(distributeBountyPool(4000, 2)).toEqual([2000, 2000]);
  });

  it('hands remainder cents to the earliest Furies rather than dropping them', () => {
    const shares = distributeBountyPool(1000, 3);
    expect(shares).toEqual([334, 333, 333]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(1000);
  });

  it('distributes a pool smaller than the Fury count without losing a cent', () => {
    const shares = distributeBountyPool(2, 5);
    expect(shares).toEqual([1, 1, 0, 0, 0]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(2);
  });

  it('returns all-zero shares for the DR-002 empty pool', () => {
    expect(distributeBountyPool(0, 3)).toEqual([0, 0, 0]);
  });

  it('returns nothing when there are no Furies, rather than dividing by zero', () => {
    expect(distributeBountyPool(500, 0)).toEqual([]);
  });

  it('rejects fractional cents so a share can never be un-transferable', () => {
    expect(() => distributeBountyPool(10.5, 2)).toThrow(/integer cents/i);
  });
});
