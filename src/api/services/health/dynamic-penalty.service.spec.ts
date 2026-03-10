import { RecoveryState, RECOVERY_MATRIX } from '../../../shared/libs/behavioral-logic';
import { DynamicPenaltyService } from './dynamic-penalty.service';


describe('DynamicPenaltyService', () => {
  let service: DynamicPenaltyService;

  beforeEach(() => {
    service = new DynamicPenaltyService();
  });

  it('should return STATE_LOCKDOWN for contracts in first 14 days', () => {
    const startedAt = new Date('2026-03-01T00:00:00Z');
    const now = new Date('2026-03-05T00:00:00Z'); // Day 4
    
    const result = service.calculateState(startedAt, now);
    
    expect(result.state).toBe(RecoveryState.LOCKDOWN);
    expect(result.multiplier).toBe(2.5);
  });

  it('should return STATE_WEEKEND_SHIELD during weekend (Fri 5PM - Sun 9AM)', () => {
    const startedAt = new Date(2026, 1, 1); // Feb 1, 2026 (Local)
    const fridayNight = new Date(2026, 2, 13, 20, 0, 0); // March 13, 2026, 8:00 PM (Local)
    
    const result = service.calculateState(startedAt, fridayNight);
    
    expect(result.state).toBe(RecoveryState.WEEKEND_SHIELD);
    expect(result.multiplier).toBe(2.0);
  });

  it('should return STATE_REWARD_INJECTION exactly on Day 21', () => {
    const startedAt = new Date(2026, 2, 1); // March 1, 2026
    const day21 = new Date(2026, 2, 22, 12, 0, 0); // March 22, 2026 (Sunday noon)
    
    // Day 21 is a Sunday. Check if reward injection (Day 21) takes precedence over weekend.
    const result = service.calculateState(startedAt, day21);
    
    expect(result.state).toBe(RecoveryState.REWARD_INJECTION);
    expect(result.refundPct).toBe(0.05);
  });


  it('should return STATE_FRICTION_DELAY between Day 45 and 60', () => {
    const startedAt = new Date('2026-01-01T00:00:00Z');
    const day50 = new Date('2026-02-20T12:00:00Z'); // 50 days later
    
    const result = service.calculateState(startedAt, day50);
    
    expect(result.state).toBe(RecoveryState.FRICTION_DELAY);
    expect(result.multiplier).toBe(1.5);
    expect(result.delayHrs).toBe(48);
  });

  it('should return STATE_ALPHA_COMPLETE after Day 90', () => {
    const startedAt = new Date('2025-12-01T00:00:00Z');
    const day95 = new Date('2026-03-06T12:00:00Z');
    
    const result = service.calculateState(startedAt, day95);
    
    expect(result.state).toBe(RecoveryState.ALPHA_COMPLETE);
    expect(result.feePct).toBe(0);
  });

  it('should return STATE_NORMAL for baseline periods (e.g. Day 30)', () => {
    const startedAt = new Date('2026-02-01T00:00:00Z');
    const day30 = new Date('2026-03-03T12:00:00Z'); // Tuesday
    
    const result = service.calculateState(startedAt, day30);
    
    expect(result.state).toBe(RecoveryState.NORMAL);
    expect(result.multiplier).toBe(1.0);
  });
});
