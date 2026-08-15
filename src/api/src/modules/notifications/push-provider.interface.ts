export interface PushMessage {
  token: string;
  title: string;
  body?: string;
  data?: Record<string, string>;
}

export interface PushResult {
  status: 'SENT' | 'FAILED' | 'UNREGISTERED';
  providerResult?: string;
  errorMessage?: string;
  /**
   * Handle for phase two. A send returns a ticket, not a delivery — the real
   * verdict arrives later against this id (see {@link PushProvider.fetchReceipts}).
   */
  ticketId?: string;
}

/**
 * Phase-two verdict for a single ticket.
 *
 * `errorCode` is the provider's machine-readable reason (DeviceNotRegistered,
 * MessageTooBig, MessageRateExceeded, InvalidCredentials, …) — only that code
 * is safe to branch on; the human message wording is not a contract.
 */
export interface PushReceipt {
  status: 'OK' | 'ERROR';
  errorCode?: string;
  errorMessage?: string;
}

export interface PushProvider {
  readonly name: string;
  send(message: PushMessage): Promise<PushResult>;
  /**
   * Resolve receipts for previously issued tickets. Tickets whose receipt is
   * not ready yet are simply absent from the returned map — absence is "ask
   * again later", never a failure.
   */
  fetchReceipts(ticketIds: string[]): Promise<Map<string, PushReceipt>>;
}
