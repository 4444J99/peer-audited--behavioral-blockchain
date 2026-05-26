import { randomBytes } from 'crypto';

export type SseTicketScope = 'notifications' | 'fury';

interface SseTicketRecord {
  userId: string;
  scope: SseTicketScope;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60_000;
const tickets = new Map<string, SseTicketRecord>();

function cleanupExpiredTickets(now = Date.now()): void {
  for (const [ticket, record] of tickets.entries()) {
    if (record.expiresAt <= now) {
      tickets.delete(ticket);
    }
  }
}

export function issueSseTicket(
  userId: string,
  scope: SseTicketScope,
  ttlMs = DEFAULT_TTL_MS,
): { ticket: string; expiresInSeconds: number } {
  cleanupExpiredTickets();

  const ticket = randomBytes(24).toString('hex');
  tickets.set(ticket, {
    userId,
    scope,
    expiresAt: Date.now() + ttlMs,
  });

  return {
    ticket,
    expiresInSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
  };
}

export function consumeSseTicket(ticket: string, scope: SseTicketScope): string | null {
  cleanupExpiredTickets();

  const record = tickets.get(ticket);
  if (!record) {
    return null;
  }

  // AU7: validate scope + expiry BEFORE deleting the ticket. The old order deleted
  // first, so presenting a valid ticket to the wrong-scope (or after-expiry) stream
  // burned it — a DoS on the victim's own subscription. Only consume (delete) the
  // ticket once it has actually passed validation and is being honored.
  if (record.scope !== scope) {
    return null;
  }

  if (record.expiresAt <= Date.now()) {
    return null;
  }

  tickets.delete(ticket);

  return record.userId;
}
