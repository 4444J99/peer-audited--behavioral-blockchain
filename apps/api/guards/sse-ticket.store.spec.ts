import { issueSseTicket, consumeSseTicket } from './sse-ticket.store';

describe('sse-ticket.store', () => {
  it('issues a single-use ticket that is consumed on first valid use', () => {
    const { ticket } = issueSseTicket('user-1', 'notifications');

    expect(consumeSseTicket(ticket, 'notifications')).toBe('user-1');
    // Second use fails — it was consumed (single-use).
    expect(consumeSseTicket(ticket, 'notifications')).toBeNull();
  });

  it('AU7: a wrong-scope presentation does NOT burn the ticket', () => {
    const { ticket } = issueSseTicket('user-2', 'fury');

    // Presenting the fury ticket to the notifications stream must fail WITHOUT
    // consuming it — otherwise an attacker (or a misrouted client) could DoS the
    // victim's own subscription by burning their valid ticket.
    expect(consumeSseTicket(ticket, 'notifications')).toBeNull();

    // The ticket is still valid for its correct scope.
    expect(consumeSseTicket(ticket, 'fury')).toBe('user-2');
  });

  it('AU7: an expired ticket is rejected without being relied upon', () => {
    const { ticket } = issueSseTicket('user-3', 'notifications', 1);
    // Advance past the 1ms TTL.
    const realNow = Date.now;
    Date.now = () => realNow() + 1000;
    try {
      expect(consumeSseTicket(ticket, 'notifications')).toBeNull();
    } finally {
      Date.now = realNow;
    }
  });

  it('returns null for an unknown ticket', () => {
    expect(consumeSseTicket('does-not-exist', 'fury')).toBeNull();
  });
});
